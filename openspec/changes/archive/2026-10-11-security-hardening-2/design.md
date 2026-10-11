## Context

See `proposal.md` — Why. Relevant current state:

- **Deploy:** `.github/workflows/ci-cd.yml` connects with `ssh -o StrictHostKeyChecking=no` in both the `build` and `deploy` jobs (lines 90, 92, 103, 126). It writes `docker-compose.yml` to the host, streams `docker save | gzip` over SSH (`gunzip | docker load`), and pipes `scripts/deploy.sh` into `bash -s` on the host. No `known_hosts` is pinned and no `DEPLOY_KNOWN_HOSTS` secret exists.
- **Edge:** the app container publishes only `127.0.0.1:3000` (`docker-compose.yml:41`) and is fronted by host-level Caddy (`docs/07-deployment-observability.md:91-98`), whose documented block is a plain `reverse_proxy 127.0.0.1:3000 { flush_interval -1 }` with **no** `header_up X-Forwarded-For` overwrite.
- **Client IP:** `src/core/http/client-ip.ts` returns the left-most `X-Forwarded-For`, else `X-Real-IP`, else `unknown`. It is the sole key for `rateLimitByIp` (`src/core/http/rate-limit-guard.ts:16`) and for the register limiter (`src/app/api/auth/register/route.ts:16`). The shared limiter is Postgres-backed (`src/core/http/rate-limit.ts`).
- **Group reads:** `getGroup` (`src/modules/groups/service.ts:33`), `listGroupRatings` (`:129`) and `listDiscussions` (`src/modules/discussions/service.ts:107`) take no viewer and do no access check; only the two group pages call `canViewGroup` first. `getDiscussion` already self-guards (`src/modules/discussions/service.ts:122`).
- **Streams:** `GET /api/feed/stream` (`src/app/api/feed/stream/route.ts`) is a raw handler (not wrapped by `withRoute`); each request adds to the unbounded listener `Set` in `src/core/db/activity-channel.ts:99`, starts a 25s heartbeat interval, and runs its own `getVisibleEvent` query per activity event.

## Goals / Non-Goals

**Goals:**
- Deploy only to a host whose identity is verified against a pinned key, and fail closed otherwise.
- Derive the throttling identity only from a trusted edge, so a forged forwarding header cannot mint a fresh limiter key.
- Make group-scoped reads deny access on their own, independent of the caller.
- Bound concurrent SSE streams per identity and rate-limit new stream connections.

**Non-Goals:**
- Container image signing / digest attestation (cosign). The image already travels inside the authenticated SSH channel; signing is a separate supply-chain control and does not by itself close A08.
- Provisioning or replacing the host Caddy config. It lives outside the repo; this change specifies the required directive and makes the app's trust depend on it.
- Changing the shared rate-limiter store (Postgres is already correct) or adding multi-instance concerns.
- An invitation flow for restricted groups.

## Decisions

### D1 — Pin the host key and fail closed in CI (A08)

Add a `DEPLOY_KNOWN_HOSTS` secret. Each job installs it to `~/.ssh/known_hosts` (mode 600) and connects with `-o StrictHostKeyChecking=yes -o UserKnownHostsFile=~/.ssh/known_hosts`; every `StrictHostKeyChecking=no` is removed. If the secret is empty, the step fails before any connection.

- *Why:* closes the runner→host MITM path that can impersonate the deploy host and run arbitrary code in production; satisfies the "verify by pinned key / fail closed" requirements with no unchecked fallback.
- *Alternatives:* `ssh-keyscan` at connect time — rejected, it trusts the very network being secured. Image signing — deferred (Non-Goal).
- *Ops:* the operator fills `DEPLOY_KNOWN_HOSTS` from the host's own `/etc/ssh/ssh_host_*_key.pub` (not from the network). The pipeline fails closed until it is set.

### D2 — Trust only a trusted-edge client identity (A07)

The app cannot see the TCP peer address in App Router handlers, and it is bound to loopback with Caddy as the only reachable producer of requests. So the trustworthy identity must come from the edge, and the app must stop trusting anything the client can set:

- The edge (Caddy) overwrites the client address: `header_up X-Forwarded-For {remote_host}` and strips any client `X-Real-IP`. This is documented and required, matching the existing `.env.example:5` instruction.
- `getClientIp` takes the **left-most** `X-Forwarded-For` entry only when it parses as a valid IP address, and **drops the `X-Real-IP` fallback entirely** (Caddy never sets it, so it is purely client-controlled today).
- When no valid trusted value is present, return a single shared sentinel (`unknown`) so a misconfigured edge degrades to one shared bucket instead of one bucket per forged value.
- Add a `TRUSTED_PROXIES` env documenting the edge; `npm run verify:env` is extended with a production note.

- *Why:* without an overwrite there is no trusted value, and the limiter can be evaded with one header per request. Binding the guarantee to the edge config is the only correct place given the missing peer address.
- *Alternatives:* (a) keep trusting left-most XFF — rejected, spoofable. (b) edge sets a shared-secret header the app requires before trusting XFF — stronger, defeats a non-edge local caller, but adds a managed secret; rejected as heavier than needed because the port is loopback-only.
- *Trade-off:* if the operator fails to apply the edge overwrite, all clients collapse into the `unknown` bucket, which throttles legitimately rather than failing open. That is the safe direction.

### D3 — Group reads self-guard (A01)

Change the read signatures to take the viewer (`getGroup(actor, groupId)`, `listGroupRatings(actor, groupId)`, `listDiscussions(actor, groupId)`), have each call `canViewGroup` internally, and return not-found without content when denied (never reveal existence). Update the two page callers to pass the resolved actor; the pages keep their own early check for a clean 404 but no longer carry the security decision alone.

- *Why:* removes the "forgetful caller" IDOR class; makes the guard a property of the operation. TypeScript surfaces every un-updated caller at compile time.
- *Alternatives:* page-only checks plus a lint rule — rejected, weaker and easily bypassed by a new handler.

### D4 — Bound the SSE stream per identity (A04)

Wrap the stream endpoint with the shared rate limiter keyed by the trusted identity, and track active streams per actor with a small cap; a request over the cap is refused with 429 **before** a listener is registered. Decrement the counter in both the abort and `cancel()` paths.

- *Why:* bounds listeners, heartbeat timers and sockets per client and stops the per-event `getVisibleEvent` query amplification (N streams = N queries per event).
- *Alternatives:* a global cap only — rejected, one client could exhaust it; idle-stream timeout — complementary, not added here.

## Risks / Trade-offs

- [Deploy stops if `DEPLOY_KNOWN_HOSTS` is unset] → intended fail-closed; documented in the runbook so the operator sets it before the next deploy.
- [Edge not reconfigured to overwrite XFF] → the app drops the `X-Real-IP` fallback and validates the IP format, so a wrong config collapses to the shared `unknown` bucket rather than failing open; the required directive is documented and checked by `verify:env`.
- [Dropping `X-Real-IP` could break a deployment that relied on it] → the documented Caddy block never set it, so no supported path depends on it.
- [Read-signature change ripples to callers] → exactly the intended compile-time safety; all in-repo callers are the two group pages.
- [Per-actor stream cap can be multiplied by holding multiple accounts] → defense-in-depth; a global cap can be layered later.
- [Seeded restricted group with no members stays unviewable] → unchanged from `security-hardening`; not addressed here.

## Migration Plan

1. Create the `DEPLOY_KNOWN_HOSTS` secret from the host's public host key; apply the Caddy `header_up X-Forwarded-For {remote_host}` overwrite (and no `X-Real-IP`); add `TRUSTED_PROXIES` to the host `.env`.
2. Ship the code (CI + app) and the updated Caddy block; verify a deploy succeeds and a spoofed `X-Forwarded-For` does not reset the auth allowance.
3. Rollback: the existing deploy rollback re-tags the previous image; reverting the Caddy block and the app image restores prior behavior. Rolling back `client-ip.ts` alone restores the previous (weaker) keying; no data migration is involved.

## Open Questions

- None blocking. Whether to later add edge shared-secret authentication (D2 option b) or an idle-stream timeout (D4) can be decided without changing these specs or the task breakdown.
