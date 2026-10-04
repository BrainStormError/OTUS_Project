## Context

The repository is greenfield: it contains only `GUIDE.md` and an empty `openspec/` tree. `GUIDE.md` already fixes most of the stack and the invariants; see `proposal.md` for motivation and `specs/platform/*` for the behavioral requirements this design must satisfy. The constraints that shape the approach are a small team, a single small host (one application container plus one database), and a course context where the project profile (product, domain, roles) is still a placeholder.

## Goals / Non-Goals

**Goals:**

- Produce a reproducible, one-command development and deploy foundation that enforces the guide's invariants by construction.
- Make the layering (`app -> modules -> core`) and the environment boundary machine-checkable rather than convention-only.
- Deliver the `directory` module as a working reference implementation of the module template.

**Non-Goals:**

- Domain feature behavior for donations, wishes, and support (deferred; no domain requirements exist yet).
- Any external observability backend, message broker, or orchestration platform.
- Choosing the OAuth identity provider and filling the project profile in `GUIDE.md`.

## Decisions

### Next.js App Router with RSC and `output: 'standalone'`

Use a single Next.js process serving both RSC-rendered reads and Route Handlers for mutations, built with `output: 'standalone'`.

- Why: one process fits the single-container host; RSC removes the need for a client data-fetching cache and a state manager.
- Alternatives: separate SPA + API service (rejected: two processes, more ops); Pages Router (rejected: weaker server-component model).

### PostgreSQL accessed through `pg`, no ORM

Use `pg` with hand-written, parameterized SQL behind a repository per module.

- Why: transparent queries, small dependency surface, predictable memory on a small host, and direct control over indexes and transactions.
- Alternatives: Prisma/Drizzle (rejected for this scope: codegen and heavier runtime); query builder (rejected: adds abstraction without removing SQL).

### Layer boundaries enforced by `dependency-cruiser`

Encode `app -> modules -> core`, `components -> modules`, and "no cross-module repository imports" as dependency-cruiser rules and run them in the blocking CI gate `npm run deps:check`.

- Why: a rule that lives only in a document drifts; a failing build does not.
- Alternatives: ESLint import rules (rejected: weaker path/alias modeling); code review only (rejected: not automatic).

### Typed `Result` for expected failures, exceptions for the unexpected

Expected rejections (validation, authorization, business rules) return a typed result; unexpected faults throw and are caught by the route wrapper.

- Why: makes expected outcomes exhaustively handled and testable; keeps 500s reserved for real defects.
- Alternatives: exceptions for everything (rejected: expected paths become control flow via catch); `null`/boolean returns (rejected: lose the failure code).

### Validate at the boundaries with `zod`, fail fast on config

A single zod env schema validates configuration at startup and aborts on error; request bodies are validated with per-module zod schemas reused by client forms.

- Why: one contract per boundary, shared between client and server; misconfiguration is caught at boot, not in production.
- Alternatives: manual validation (rejected: drift); trusting `NODE_ENV` semantics implicitly (rejected: the guide requires validated `secure` behavior from env, not framework magic).

### Structured stdout logging with redaction, no external sink initially

Emit single-line JSON with level, event, timestamp, and request id to stdout; redact sensitive field names and sanitize request values.

- Why: the host collector can scrape stdout without adding a dependency or cost; request ids make failures traceable.
- Alternatives: a logging SaaS or a local aggregator (rejected: cost and ops for a small team at start).

### `node-pg-migrate` with `schema.sql` treated as "migration 0"

Version all schema changes as migrations; the initial schema lands as the first migration. Applied migrations are immutable.

- Why: a reversible, ordered schema history is required for safe deploys and rollback.
- Alternatives: `umzug` (viable; `node-pg-migrate` chosen for its SQL-migration support and lower setup).

### Auth.js/NextAuth with database-sourced roles

Use Auth.js for the OAuth flow; store the session in an `HttpOnly` + `Secure` + `SameSite=Lax` cookie with a bounded TTL; resolve the actor and role from the database on each request via a per-request cached accessor.

- Why: a proven OAuth flow, and role truth in the database rather than in a possibly stale token.
- Alternatives: custom OAuth (rejected: security surface); role-in-token (rejected: revocation lag).

### `directory` module as the first vertical slice

Implement the reading-directory module (per `GUIDE.md` Step 4) as the reference: one RSC page reading through `service.ts`, one mutation through a Route Handler with zod and policy.

- Why: proves the layering and the module template end to end before domain work begins; `directory` is domain-neutral enough to serve as the template.
- Alternatives: start directly on a domain module (rejected: the domain profile is unfilled, which would force invented requirements).

### Test pyramid with Testcontainers for integration

Vitest + Testing Library for unit/component, Testcontainers-backed PostgreSQL for integration, Playwright for critical e2e paths.

- Why: real-Postgres integration tests catch transaction and SQL issues that mocks cannot; unit tests stay fast and dependency-free.
- Alternatives: SQLite for integration (rejected: different SQL semantics from the production database); mocks only (rejected: misses real transaction behavior).

## Risks / Trade-offs

- Testcontainers requires a working Docker daemon, including in CI -> Mitigation: document the requirement, keep integration in a dedicated job, and allow it to be skipped for local unit-only runs.
- Hand-written SQL and row mapping invite drift between queries and types -> Mitigation: map `snake_case` to `camelCase` in one place per module, use named `RETURNING` columns, and cover repositories with integration tests.
- A CSP with a per-request nonce can break Next.js inline scripts if the nonce is not propagated correctly -> Mitigation: generate the nonce in middleware and pass it through the headers Next.js expects; verify with an e2e smoke test.
- `dependency-cruiser` rules can produce false positives on framework-generated paths -> Mitigation: scope rules to `src/` and maintain the rule set in one config with an explicit allowlist.
- Greenfield deploy ordering: the app can start before the database is ready -> Mitigation: `docker-compose` depends on a database healthcheck and runs migrations before the app container starts.
- Exact-tooling churn (Next.js/Auth.js major versions) -> Trade-off: pin versions and let the CI gates (`build`, `typecheck`) surface breakage early.

## Migration Plan

This is a greenfield bootstrap, so there is no data migration.

1. Land toolchain and configuration (Next.js, TypeScript, Tailwind, aliases, zod env).
2. Land infrastructure (`core/db`, `core/log`, `core/http`, `core/result`, `core/auth/policy`).
3. Land security baseline (security headers, CSP nonce middleware, Auth.js wiring, origin guard).
4. Land the `directory` vertical slice and the `loading`/`empty`/`error` states.
5. Land tests and blocking CI gates.
6. Land Docker, compose, `.env.example`, and docs.

Rollback: deploy keeps the previous image and database migrations are reversible; on failure, restore the previous image and run the reverse migration for any migration introduced in the failed release.

## Resolved Questions

Resolved with the user at bootstrap completion (task 12.4):

- **OAuth provider:** Google is the configured identity provider (`next-auth/providers/google`).
- **Demo login:** kept enabled via `DEMO_LOGIN=1` for the course environment and e2e runs.
- **Registration ticket:** the one-time HMAC ticket and `/api/auth/register` ship now (not deferred).
- **Project profile:** movie tracker — mark watched films solo or in groups, with personal
  and group statistics in parallel. Roles: `user` and `admin`. The concrete profile is
  recorded in `GUIDE.md` → «Профиль проекта (зафиксировано)». Domain behavior (films,
  groups, statistics) remains out of scope for this bootstrap and arrives as separate changes.
