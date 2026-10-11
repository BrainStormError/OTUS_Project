## 1. Group read access control

- [x] 1.1 Add a `group:view` action to `src/core/auth/policy.ts` (open groups allowed for any actor; restricted groups only for `admin`/`member`), and verify the policy unit test covers every branch (`npm test`)
- [x] 1.2 Add `canViewGroup(actor, groupId)` to `src/modules/groups/service.ts` using the existing role lookup, and verify a unit/integration test returns false for a non-member of a restricted group (`npm run test:integration`)
- [x] 1.3 Make `getDiscussion` tenant-aware in `src/modules/discussions/service.ts` (resolve and check the discussion's group before returning it or its posts), and verify a test requesting a foreign group's discussion id returns not-found (`npm run test:integration`)
- [x] 1.4 Guard `src/app/(app)/groups/[id]/page.tsx` with `canViewGroup` before loading any tab (members, discussions, posts, ratings, stats) and `notFound()` on denial; verify a non-member of the restricted group gets 404 with no member/content markup (`npm run test:e2e`)
- [x] 1.5 Apply the same view rule on `src/app/(app)/groups/[id]/admin/page.tsx` so the member list is not exposed without access; verify a non-member receives no member list (`npm run test:e2e`)
- [x] 1.6 Verify an open group is still readable by a non-member and by a member of a restricted group (`npm run test:e2e`)

## 2. Authentication trust and identity

- [x] 2.1 Gate the demo provider in `src/modules/auth/auth.ts` on `DEMO_LOGIN === '1' && env.NODE_ENV !== 'production'` and refuse demo `authorize` in production; verify a production-configured attempt creates no session (`npm test`)
- [x] 2.2 Update `findOrCreateDemoUser` in `src/modules/auth/repository.ts` to resolve only demo-provisioned accounts and to create new ones with role `employee`; remove the email-prefix role rule; verify a demo sign-in never returns an existing privileged account and a new `admin*` email is `employee` (`npm run test:integration`)
- [x] 2.3 Add `findUserByProviderSubject` and switch the Google `signIn` callback in `src/modules/auth/auth.ts` to subject-based matching, using email only to bind the subject once for legacy rows; verify a demo/ticket account sharing an email is not inherited by the Google callback (`npm run test:integration`)
- [x] 2.4 Set `trustHost: false` and rely on `AUTH_URL`/`APP_ORIGIN`; verify OAuth callback/redirect targets use the canonical origin and not a spoofed host header (`npm test`)
- [x] 2.5 Add a deploy note that the reverse proxy must overwrite `Host`/`X-Forwarded-*` and that `AUTH_URL` equals `APP_ORIGIN`; verify `npm run verify:env` passes

## 3. HTTP request guards

- [x] 3.1 Replace the buffered body read in `src/core/http/with-route.ts` with a streamed, byte-counted read that aborts past `maxBodyBytes` (reject 413 before full buffering); verify an oversized chunked body without `content-length` is rejected (`npm test`)
- [x] 3.2 Refactor the routes that pre-read the body (`groups/[id]/ratings`, `groups/[id]/discussions`, `discussions/[id]/posts`) so `withRoute` is the single reader, injecting the path-derived id through the guard's param context; verify the existing route tests still pass (`npm test`)
- [x] 3.3 Introduce a `RateLimiter` interface with async `consume` and a bounded, pooled Postgres-backed implementation; verify concurrent requests for the same key across pooled connections count against one limit (`npm run test:integration`)
- [x] 3.4 Add a bounded in-memory implementation for tests with idle-key eviction; verify a burst of distinct keys does not grow memory unbounded (`npm test`)
- [x] 3.5 Wrap the auth `GET`/`POST` handlers in `src/app/api/auth/[...nextauth]/route.ts` and add a limiter to `src/app/api/auth/register/route.ts`, keyed by the trusted proxy-set client IP; verify repeated attempts are refused after the allowance (`npm run test:integration`)

## 4. Authentication audit logging

- [x] 4.1 Emit redaction-safe audit events on demo authorize, Google sign-in success, and sign-in failure in `src/modules/auth/*`; verify a success and a failure each produce an audit record and the records contain no credential/token/ticket/session/password fields (`npm test`)

## 5. Verification and documentation

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, and `npm run deps:check`; verify all pass with no new boundary violations
- [x] 5.2 Extend the seed/e2e fixtures so a restricted group has a known member and a known non-member; verify the access-control e2e scenarios are deterministic (`npm run db:seed` then `npm run test:e2e`)
- [x] 5.3 Update `docs/04-auth-security.md` (view authorization, subject identity, demo gating, shared limiter, audit events) and `README.md`/`.env.example` (demo-mode and canonical-origin notes); verify the documented behavior matches the implemented rules
