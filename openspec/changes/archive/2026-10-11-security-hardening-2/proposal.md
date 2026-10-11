## Why

A follow-up review of the already-hardened application confirmed four gaps the completed (but unarchived) `security-hardening` change did not close. Two are real: the deploy pipeline disables SSH host-key verification, so an attacker on the runner-to-host path can impersonate the deploy host and run arbitrary code in production; and the auth rate limiter keys on a client-supplied `X-Forwarded-For`/`X-Real-IP` that the documented Caddy edge does not overwrite, so an attacker mints a fresh limiter key per request and brute force stays unthrottled. Two are defense-in-depth: group-scoped reads are guarded only by their page callers, and the SSE feed endpoint accepts unbounded long-lived connections per user. This change closes the two real gaps and tightens the other two.

## What Changes

- The deploy pipeline verifies the target host identity with a **pinned host key** and strict checking; every `ssh -o StrictHostKeyChecking=no` step is removed and a deploy that cannot verify the host fails closed. [A08]
- Client identity for rate limiting is derived **only** from a trusted edge that overwrites the forwarding headers, so a forged `X-Forwarded-For`/`X-Real-IP` cannot produce a fresh limiter key; the auth-endpoint keying changes accordingly. [A07]
- Group-scoped reads (`getGroup`, `listGroupRatings`, `listDiscussions`) **enforce view access inside the service** instead of relying on every caller, so a new or forgetful caller cannot leak restricted-group content. [A01]
- The activity SSE stream endpoint is **rate-limited and capped per identity**; excess long-lived connections are refused early. [A04]
- The deploy runbook documents the pinned host key and the edge directive that overwrites the forwarding headers the client-IP trust depends on.

## Capabilities

### New Capabilities

- `security/deploy-integrity`: Deploy delivery trusts only a host whose key is pinned; the pipeline fails closed when the host cannot be verified.

### Modified Capabilities

- `security/request-guards`: the client identity used for rate limiting becomes trustworthy (derived from a trusted edge, never from a forged header alone), and long-lived stream connections are bounded per identity. The base comes from the completed but unarchived `security-hardening` change; because that base spec is not yet in `openspec/specs/`, this delta adds these requirements rather than rewriting the base ones, so it remains archivable in either archive order.
- `security/group-access`: group-scoped reads become self-guarding, so the single view decision cannot be omitted by a caller. Same base-source and ADDED-operation note as above.

## Impact

- **CI/CD:** `.github/workflows/ci-cd.yml` — install a pinned `known_hosts`, use `StrictHostKeyChecking=yes`, and add a `DEPLOY_KNOWN_HOSTS` secret; no step may fall back to `no`.
- **HTTP / rate limiting:** `src/core/http/client-ip.ts`, `src/core/http/rate-limit-guard.ts`, `src/app/api/auth/register/route.ts`, the auth handler wrapping, and `src/core/config/env.ts` (trusted-edge setting).
- **Streams:** `src/app/api/feed/stream/route.ts` and `src/core/db/activity-channel.ts`.
- **Access control:** `src/modules/groups/service.ts`, `src/modules/discussions/service.ts`, `src/modules/ratings/service.ts`, plus their callers `src/app/(app)/groups/[id]/page.tsx` and `src/app/(app)/groups/[id]/admin/page.tsx`.
- **Docs:** `docs/07-deployment-observability.md` and `.env.example` (pinned host key; edge must overwrite `Host`/`X-Forwarded-*`).
- **Tests:** unit tests for client-IP resolution (spoofed headers rejected) and the per-identity stream cap; integration tests for rate limiting under a spoofed `X-Forwarded-For`; access-control coverage for the service-level guard.
- **Ops note:** introducing `DEPLOY_KNOWN_HOSTS` requires the operator to populate the host key before the next deploy; the pipeline fails closed meanwhile.
