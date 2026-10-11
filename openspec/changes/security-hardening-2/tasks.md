## 1. Verify the deploy host (A08)

- [x] 1.1 Add a `DEPLOY_KNOWN_HOSTS` secret and a "Trust deploy host" step in `.github/workflows/ci-cd.yml` that installs it to `~/.ssh/known_hosts` (mode 600) before any connection; verify the step fails when the secret is empty (fails closed)
- [x] 1.2 Replace every `ssh -o StrictHostKeyChecking=no` in the `build` and `deploy` jobs with `-o StrictHostKeyChecking=yes -o UserKnownHostsFile=~/.ssh/known_hosts`; verify no `StrictHostKeyChecking=no` remains in the file
- [ ] 1.3 Verify a deploy to the real host succeeds with the pinned key, and that a mismatched host key refuses the connection and delivers nothing

## 2. Trusted client identity for rate limiting (A07)

- [x] 2.1 Add a `TRUSTED_PROXIES` setting to `src/core/config/env.ts` (schema plus `.env.example` documentation) describing the trusted edge; verify `npm run verify:env` passes
- [x] 2.2 Rewrite `getClientIp` in `src/core/http/client-ip.ts` to take the left-most `X-Forwarded-For` only when it parses as a valid IP, drop the `X-Real-IP` fallback, and return a single shared `unknown` otherwise; verify unit tests cover a forged header, an invalid value, and a missing header (`npm test`)
- [x] 2.3 Confirm `rateLimitByIp` (`src/core/http/rate-limit-guard.ts`) and the register limiter (`src/app/api/auth/register/route.ts`) key on the new identity; verify an integration test that repeats a request with a different spoofed `X-Forwarded-For` each time is refused after the allowance (`npm run test:integration`)
- [x] 2.4 Document the mandatory edge overwrite (`header_up X-Forwarded-For {remote_host}`, no `X-Real-IP`) in `docs/07-deployment-observability.md` and `.env.example`; verify the documented directive matches the code's expectation

## 3. Group reads self-guard (A01)

- [x] 3.1 Make `getGroup` and `listGroupRatings` (`src/modules/groups/service.ts`) and `listDiscussions` (`src/modules/discussions/service.ts`) take the viewer and deny through `canViewGroup` (not-found, no content, no existence disclosure); verify an integration test that a non-member read returns not-found (`npm run test:integration`)
- [x] 3.2 Update `src/app/(app)/groups/[id]/page.tsx` and `src/app/(app)/groups/[id]/admin/page.tsx` to pass the resolved actor and keep their early 404; verify `npm run typecheck` reports no missed callers
- [x] 3.3 Verify a member/administrator still reads the group and its content and an open group stays readable by a non-member (`npm run test:e2e`)

## 4. Bound long-lived streams (A04)

- [x] 4.1 Add a per-identity active-stream counter and cap in `src/app/api/feed/stream/route.ts`, refusing an over-cap request with a 429 before subscribing and decrementing on abort and `cancel()`; verify a test refuses the connection past the cap and frees the slot on disconnect
- [x] 4.2 Apply the shared rate limiter to new stream connections, keyed by the trusted identity; verify rapid repeated connections are throttled

## 5. Verification and documentation

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, and `npm run deps:check`; verify all pass with no new boundary violations
- [x] 5.2 Update `docs/07-deployment-observability.md` (pinned host key, `DEPLOY_KNOWN_HOSTS`, edge overwrite) and `.env.example` (`TRUSTED_PROXIES`); verify the documented behavior matches the implementation
- [x] 5.3 Verify the full change with `openspec validate "security-hardening-2" --strict`
