## 1. Toolchain and project skeleton

- [x] 1.1 Initialize Next.js (App Router, TypeScript, `src/`) and verify `next dev` starts and the placeholder page renders
- [x] 1.2 Enable `strict` and `noUncheckedIndexedAccess` in `tsconfig.json` and map `@/*` to `src/*`; verify `npm run typecheck` passes
- [x] 1.3 Create the canonical directories `src/{app,modules,core,components,types}`, `tests/{unit,integration,e2e}`, `db/seed`, `docs/`, `public/`; verify all directories exist
- [x] 1.4 Add Tailwind and initialize shadcn/ui; verify a shadcn `Button` renders and picks up theme tokens

## 2. Environment configuration (fail-fast)

- [x] 2.1 Implement `core/config/env.ts` with the zod schema from `GUIDE.md`; verify a unit test passes on valid values and throws naming the variable for a missing/invalid one
- [x] 2.2 Write `.env.example` listing every variable name without secret values; verify a CI step validates the schema against dummy values
- [x] 2.3 Enforce single-source env access (no `process.env` outside `core/config`); verify lint/deps check flags a deliberate violation

## 3. Database and migrations

- [x] 3.1 Implement `core/db/pool.ts` with one shared `pg.Pool`; verify an integration test executes a query and reuses the single pool
- [x] 3.2 Implement `core/db/transaction.ts` (`withTransaction`); verify an integration test confirms rollback on error and commit on success
- [x] 3.3 Configure `node-pg-migrate` and scripts `db:migrate`, `db:rollback`, `db:new`; verify up-then-down against a Testcontainers instance
- [x] 3.4 Add the initial `init` migration (users table plus unique indexes on email and provider subject); verify an integration test asserts the columns and indexes

## 4. Core infrastructure (result, logging, HTTP)

- [x] 4.1 Implement `core/result.ts` (`Ok`/`Err`, `ok`, `err`); verify unit tests for both shapes
- [x] 4.2 Implement `core/log/logger.ts` (structured JSON, field redaction, value sanitization); verify a unit test redacts sensitive keys and strips control characters
- [x] 4.3 Implement `core/log/request-id.ts`; verify a unit test uses an incoming id and generates one when absent
- [x] 4.4 Implement `core/http/responses.ts`; verify unit tests cover the JSON response helper
- [x] 4.5 Implement `core/http/origin.ts`; verify unit tests for trusted and untrusted origins
- [x] 4.6 Implement `core/http/with-route.ts` (request-id, origin 403, session 401, zod 400, result-to-status mapping, unexpected 500); verify unit tests cover every status branch

## 5. Security baseline

- [x] 5.1 Add HSTS, `X-Content-Type-Options`, and `Referrer-Policy` in `next.config.js`; verify a response-headers test sees them
- [x] 5.2 Add `middleware.ts` with a per-request CSP nonce; verify the nonce appears in headers and the app still renders in an e2e smoke test
- [x] 5.3 Configure the Auth.js session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, bounded TTL); verify a test asserts the cookie flags
- [x] 5.4 Add rate limiting and input length limits to mutations; verify tests reject over-limit requests
- [x] 5.5 Implement `core/auth/policy.ts::can(actor, action, resource)`; verify a truth-table unit test reaches 100% branch coverage

## 6. Authentication wiring

- [x] 6.1 Implement Auth.js options and `app/api/auth/[...nextauth]/route.ts`; verify the OAuth flow (or `DEMO_LOGIN`) authenticates a user
- [x] 6.2 Implement `modules/auth/session.ts` (`getActor`, per-request cache, role from DB); verify a deleted user loses access and a stale token role is ignored
- [x] 6.3 Implement the one-time HMAC registration ticket and `app/api/auth/register/route.ts` per the guide; verify unit tests for validity, expiry, and email match
- [x] 6.4 Add `app/(app)/layout.tsx` requiring a session; verify an e2e test redirects an unauthenticated visitor to `/login`

## 7. First vertical slice (directory module)

- [x] 7.1 Create `modules/directory/{types,schema,domain,policy,repository,service,index}.ts`; verify `deps:check` passes and an integration test covers list with limit and cursor
- [x] 7.2 Add one RSC page under `app/(app)/` reading through `service.ts`; verify it renders server-read data with no client fetch on mount
- [x] 7.3 Add one mutation through a Route Handler using `withRoute` + zod + policy; verify tests cover 401, 403, 400, and 200
- [x] 7.4 Add the feature components for that page; verify component tests cover loading, empty, and error states

## 8. Design system and UI states

- [x] 8.1 Add theme tokens and `data-theme` dark mode to `globals.css`; verify a theme switch changes appearance without editing components
- [x] 8.2 Add `components/layout` (Header, Footer, ThemeSwitcher, Banners); verify keyboard focus and labels meet the accessibility checklist
- [x] 8.3 Define and apply the shared async view states (loading/empty/error/success); verify no error is swallowed and empty is distinct from error

## 9. Testing and quality gates

- [x] 9.1 Configure Vitest + Testing Library + jsdom; verify `npm test` runs the unit suite
- [x] 9.2 Configure Testcontainers integration tests with an isolated schema per run; verify `npm run test:integration` passes on a Docker host
- [x] 9.3 Configure Playwright; verify `npm run test:e2e` runs the smoke path
- [x] 9.4 Add `dependency-cruiser` and `npm run deps:check`; verify a deliberate cross-layer import fails the check
- [x] 9.5 Define all quality scripts (`lint`, `typecheck`, `deps:check`, `test`, `test:integration`, `audit`, `build`); verify each command runs successfully

## 10. CI/CD

- [x] 10.1 Add `.github/workflows/ci-cd.yml` with a blocking checks job (lint, typecheck, deps, unit, integration, audit, build); verify it runs on a pull request
- [x] 10.2 Add the build job publishing the image tagged with commit SHA and `latest`; verify the image is produced
- [x] 10.3 Add the deploy job (save previous, deliver, migrate, up, rollback on failure) with branch concurrency; verify the rollback path is documented and exercised in a dry run

## 11. Deployment and observability

- [x] 11.1 Add the multi-stage `Dockerfile` (`standalone`, non-root); verify the image builds and runs
- [x] 11.2 Add `docker-compose.yml` with a database healthcheck, `depends_on: service_healthy`, and a loopback-bound app port; verify `docker compose up` reaches healthy state
- [x] 11.3 Add `app/api/health/route.ts` (200 ok / 503 unavailable within a bounded timeout); verify integration tests cover both cases
- [x] 11.4 Document the external uptime monitor on `/api/health`; verify the runbook exists

## 12. Documentation

- [x] 12.1 Write `README.md` (stack, run, configuration, deploy, rollback); verify all sections are present
- [x] 12.2 Adapt `GUIDE.md` into `docs/01`-`docs/08`; verify each file exists
- [x] 12.3 Write ADRs for the non-obvious decisions (raw `pg` vs ORM, typed results, dependency enforcement); verify the ADR files exist
- [x] 12.4 Resolve the design's open questions with the user (OAuth provider, demo login, registration-ticket scope, project profile) before any domain work; verify answers are recorded

## 13. End-to-end verification

- [x] 13.1 Run the full local gate sequence (lint, typecheck, deps:check, unit, integration, audit, build) and verify all pass
- [x] 13.2 Run the e2e critical path (login -> directory read -> mutation -> admin) and verify it passes
- [x] 13.3 Manually verify fail-fast startup aborts on bad env and `/api/health` returns 503 with the database stopped
