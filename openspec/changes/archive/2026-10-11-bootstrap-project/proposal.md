## Why

`GUIDE.md` fixes the engineering foundation for this project (Next.js App Router, the `app -> modules -> core` layering, PostgreSQL accessed through `pg` without an ORM, `zod` boundaries, Auth.js, enforced dependency rules, fail-fast config), but the repository currently holds **no application code, no toolchain configuration, and no enforced invariants**. Every later feature would otherwise re-decide these choices and drift from the guide. This change bootstraps that foundation once so all subsequent work builds on a verified, enforceable structure.

## What Changes

- Initialize Next.js (App Router, `output: 'standalone'`, TypeScript, `src/`) and enable `strict` plus `noUncheckedIndexedAccess`; add the `@/* -> src/*` alias.
- Create the canonical layout: `src/{app,modules,core,components,types}`, `tests/{unit,integration,e2e}`, `db/seed`, `docs/`, `public/`.
- Add Tailwind + shadcn/ui with a tokenized theme (`globals.css` variables, `data-theme` dark mode) and no hardcoded colors in JSX.
- Implement `core/config/env.ts`: a `zod` env schema that fails fast at startup; `process.env` is read **only** there.
- Implement `core/db/*`: a single `pg.Pool` per process, a `withTransaction` helper, and `node-pg-migrate` wiring with an initial migration (`schema.sql` treated as "migration 0").
- Implement `core/log/*`: structured JSON logging with field redaction and request-id propagation.
- Implement `core/http/{responses,origin,with-route}.ts` and `core/result.ts`: the `Result<T>` model and the `withRoute` contract (request-id, origin guard, session gate, zod validation, Result-to-HTTP mapping, unexpected errors to 500).
- Implement `core/auth/policy.ts::can(actor, action, resource)` as the single authorization decision point, with a full truth-table test.
- Add `src/app/api/health/route.ts` readiness endpoint (200 ok / 503 unavailable).
- Add the security baseline: CSP with per-request nonce in `middleware.ts`, HSTS / `nosniff` / `Referrer-Policy` in `next.config.js`, `HttpOnly`+`Secure`+`SameSite=Lax` session cookie, origin guard and request size/length limits on mutations.
- Add the test toolchain: Vitest + Testing Library + jsdom (unit/component), Testcontainers (integration), Playwright (e2e).
- Add `dependency-cruiser` and the `npm run deps:check` gate.
- Add a CI/CD workflow with blocking gates (`lint`, `typecheck`, `deps:check`, unit, integration, `audit --audit-level=high`, `build`) and a build -> save previous -> deliver -> migrate -> up deploy with rollback.
- Add the multi-stage `Dockerfile`, `docker-compose.yml` (DB healthcheck, loopback-bound port), and `.env.example`.
- Add `README.md` and adapt `docs/` (the guide) to the project.
- Establish **one vertical slice** — the `directory` module (bounded-context template) with one RSC page reading through `service.ts` and one mutation through a Route Handler with zod + policy — as the executable proof of the layering.

## Capabilities

### New Capabilities

- `platform/architecture-boundaries`: the canonical repository layout, the allowed `app -> modules -> core` dependency directions, and their CI enforcement via `deps:check`.
- `platform/runtime-config`: fail-fast validation of all environment configuration at startup and single-source access to env values.
- `platform/data-access`: one `pg.Pool` per process, transaction ownership by services, parameterized SQL only, and schema changes through migrations alone.
- `platform/http-contract`: the request/response contract for mutations — origin guard, session requirement, zod-validated input, and typed `Result` to HTTP status mapping.
- `platform/observability`: structured JSON logging with field redaction, per-request request-id tracing, and the health/readiness endpoint.
- `platform/authorization`: the single `can(actor, action, resource)` policy used by services and route handlers, with role sourced from the database.

### Modified Capabilities

- None. The project has no existing specs.

## Impact

- **Scope of change**: greenfield foundation — no existing behavior is replaced, so nothing is BREAKING. The entire repository (currently only `GUIDE.md` and `openspec/`) is populated.
- **New dependencies**: Next.js, React, Tailwind, shadcn/ui (Radix), `pg`, `node-pg-migrate`, `zod`, Auth.js/NextAuth, Vitest, Testing Library, Testcontainers, Playwright, `dependency-cruiser`.
- **New runtime surface**: `/api/health`, `/api/auth/[...nextauth]`, one `directory` read page and one `directory` mutation route.
- **Deferred (explicit non-goals)**: domain feature behavior for donations, wishes, and support; the project profile in `GUIDE.md` (product name, domain, roles, key scenarios) is still a placeholder, so no domain requirements are specified here. Those arrive as separate changes once the profile is confirmed.
- **Operations**: requires a PostgreSQL instance (local via `docker-compose` or managed) and the env values listed in `.env.example`.
