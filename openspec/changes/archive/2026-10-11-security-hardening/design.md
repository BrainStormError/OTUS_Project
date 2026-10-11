## Context

See `proposal.md` — Why. Relevant current state:

- `src/core/http/with-route.ts` centralizes mutation guards (origin, session, rate limit,
  body cap, zod). `src/core/http/rate-limit.ts` is a process-local `Map` with no eviction.
- Authorization lives in `src/core/auth/policy.ts` as `can(actor, action, resource)` and is
  invoked from services on writes only; no action covers reading a group.
- `src/modules/groups/service.ts` `getGroup` takes no actor; `joinGroup` is the only place
  `restricted` is checked. `src/modules/discussions/service.ts` `getDiscussion(id)` has no
  group scope.
- `src/modules/auth/auth.ts` uses `trustHost: true`, matches Google accounts by email, and
  gates the demo provider on `DEMO_LOGIN` alone. `repository.ts` derives role from the email
  text. `src/app/api/auth/[...nextauth]/route.ts` exports `handlers` unwrapped; the register
  route sets no rate limit.
- The deployment is a single app container behind Caddy (`docker-compose.yml`), with
  `AUTH_URL`/`APP_ORIGIN` already defined; `docs/04-auth-security.md` sets the convention
  that permission checks belong in the service layer.

## Goals / Non-Goals

**Goals:**
- Enforce restricted-group read access in one service-level decision reused by every read.
- Make discussion reads tenant-scoped so cross-group ids cannot leak content.
- Remove attacker-controlled inputs from trust decisions (host header, email-derived role).
- Enforce the body cap without full buffering, including routes that pre-read the body.
- Put a shared, bounded rate limiter in front of the auth endpoints.

**Non-Goals:**
- Building an invitation UI or a group-invite flow (restricted groups stay invite-only; no
  invite mechanism is added here).
- Introducing new infrastructure (no Redis); the shared limiter uses the existing Postgres.
- Reworking the general `ui/*` behavior or the session cookie model.
- Full security review remediation beyond the six findings in the proposal.

## Decisions

### D1 — A `group:view` action, enforced in the group service
Add `group:view` to `policy.ts` returning true for non-restricted groups (any actor), and for
restricted groups only when `resource.groupRole` is `admin` or `member`. Add
`canViewGroup(actor, groupId)` in `groups/service.ts` that loads the group, resolves the
actor's group role, and calls `can`. Pages (`groups/[id]`, `groups/[id]/admin`) call this once
and `notFound()` on denial; tab content is only loaded when access holds.

- *Why:* matches the project convention (`docs/04`: checks in the service), covers page and
  API reads uniformly, and keeps one source of truth.
- *Alternatives:* (a) page-only checks per the original review — rejected, bypassable by any
  new caller and against convention; (b) SQL-level filtering of `findGroupById` by viewer —
  rejected, it changes the repository contract and hides the authorization decision.

### D2 — `getGroup` and `getDiscussion` become viewer-aware
`getGroup(groupId)` keeps returning the group for internal callers but the read entry points
used by pages route through `canViewGroup`; `getDiscussion` gains a group argument (or
reloads the discussion's `groupId` and re-checks access) so a discussion id from another group
is never returned. `listDiscussions`/`listGroupRatings` are only invoked after access holds.

- *Why:* the leak exists partly because the service signature lacked the tenant/actor key.
- *Alternatives:* filtering in `discussions/repository.ts` — rejected; the policy decision
  belongs above the repository.

### D3 — Demo login is non-production only and cannot impersonate
Wrap provider registration and `authorize` so demo is active only when
`DEMO_LOGIN === '1' && env.NODE_ENV !== 'production'`; `authorize` refuses in production.
`findOrCreateDemoUser` resolves only accounts it provisioned (provider `demo` + subject =
email) and creates new accounts with role `employee`; the email-prefix role rule is deleted.

- *Why:* demo is a course affordance; it must never resolve seeded/real accounts or mint
  privilege from input.
- *Alternatives:* keep resolving any email but blocklist admin — rejected, still enumerable
  and still impersonates regular accounts.

### D4 — Identity matches on provider subject
Add a subject-based lookup (`findUserByProviderSubject(provider, subject)`) and use it in the
Google `signIn` callback. Email is used only to detect a first-time link/conflict, not to
authenticate an existing account created by another provider.

- *Why:* `docs/04` already claims subject-based identity; the code contradicted it, and the
  email-only match is what makes demo/ticket accounts inheritable.
- *Alternatives:* keep email match with a `provider` column check — rejected, brittle and
  leaves the collision window.

### D5 — Pin the canonical origin (`trustHost: false`)
Set `trustHost: false`; rely on `AUTH_URL`/`APP_ORIGIN` (already provided in compose). Note
the reverse proxy must overwrite `Host`/`X-Forwarded-*`.

- *Why:* consistent with the origin trust already used in `withRoute` (`APP_ORIGIN`).
- *Alternatives:* keep `trustHost: true` and rely on the proxy — rejected, inconsistent trust
  model and fails open if reached directly.

### D6 — Stream-capped body read; single-reader routes
Replace `await request.text()` in `with-route.ts` with a streamed read that aborts past the
cap (and measure bytes, not UTF-16 units). Refactor the group routes that currently
`await request.json()` and rebuild a `Request` so `withRoute` is the single reader — inject the
path-derived `groupId`/`discussionId` through a param context instead of re-parsing the body.

- *Why:* closes the buffering path and removes the double-read amplification.
- *Alternatives:* only add an early `content-length` check — rejected, bypassable by chunked
  or understated length.

### D7 — Shared, bounded limiter that also guards auth
Change the limiter to an interface with an async `consume`; implement a Postgres-backed
counter (increment + window expiry, keyed by operation+identity+IP) using the existing pool,
and keep a bounded in-memory implementation for tests. Evict idle keys. Wrap the exported
auth `GET`/`POST` handlers and add a limiter to the register route.

- *Why:* the current `Map` is per-instance, unbounded, keyed by `actor.id` (useless
  pre-auth), and auth routes are unguarded — the real gap.
- *Alternatives:* Redis — rejected, new infrastructure for a single-container deploy; leaving
  the in-memory map — rejected, doesn't survive >1 instance and leaks memory.
- *Client IP:* taken from a trusted, proxy-set header (Caddy overwrites it), never from an
  attacker-controlled header alone.

### D8 — Auth audit events
Emit `log('info'|'warn', 'auth.signin.success'|'auth.signin.failed'|'auth.demo', {...})`
at each outcome; the existing logger already redacts `token|session|password|credential`.

- *Why:* no success/failure records exist today; detection of brute force is impossible.

### D9 — Restricted group with no members
The seed's restricted group 4 has no members and `joinGroup` rejects restricted groups, so
under D1 it becomes visible to no one — which matches "по приглашению". This change does not
add an invite path; the guard and the invite flow are independent, and the guard is correct
either way.

## Risks / Trade-offs

- **Lockout of existing content** → a restricted group with seeded content but no members
  becomes unreadable; acceptable per D9, and the review's High finding requires exactly this.
  Revisit only if an invite path is added.
- **IP-based auth limiting behind a proxy** → wrong header usage could limit everyone or no
  one; mitigation: read only the proxy-set header, document the header in the deploy guide.
- **`trustHost: false` misconfiguration** → misconfigured `AUTH_URL` breaks OAuth callbacks;
  mitigation: `AUTH_URL` is already set from `APP_ORIGIN` in compose; add a deploy note and a
  health check remains green.
- **Postgres limiter hot path** → an extra query per limited request; mitigation: single
  upsert-style statement, small windows, and limiting only mutating/auth paths.
- **Subject-based matching migration** → existing accounts without a stored subject may fail
  to match; mitigation: fall back to email match only to establish the subject once, then
  persist it (recorded in tasks).
- **Role from email removal** → any main spec/report relying on `admin*` demo emails changes
  behavior; mitigation: seed `admin@demo.local` explicitly as admin, which the seed already
  does (`scripts/seed-dev.ts:80`).

## Migration Plan

1. Land access control (D1, D2) and the body cap (D6) — highest impact, no data change.
2. Land auth changes (D3, D4, D5) with the subject-fallback for legacy rows.
3. Land the shared limiter (D7) and audit logging (D8).
4. Rollback: each area is independently revertible; access control and auth are single-module
   changes. No schema change is destructive; the limiter may add a table (revertible).

## Open Questions

- Group invitation flow: deferred; does not change the specs or the guard approach.
- Whether the shared limiter should also back the existing in-route limits (wish/rating/
  discussion) or only auth — deferred; default is auth-first, then swap the rest.
