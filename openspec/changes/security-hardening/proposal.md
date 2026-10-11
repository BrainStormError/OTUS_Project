## Why

A security review of the application surface confirmed six real gaps, all rooted in two
missing disciplines: authorization is enforced only on writes, and trust is derived from
attacker-controlled input (request `Host`, email text, buffered body). The result is that
any authenticated user can read a "Закрытый клуб" group's members, discussions and ratings
by id, demo login can impersonate and self-promote to admin, and auth endpoints have no
brute-force protection or audit trail. This change closes the two High findings and hardens
the four Medium/Low configuration weaknesses before they are exploited.

## What Changes

- **BREAKING (behavioral):** Restricted groups become unreadable to non-members. Every
  group-scoped read (group detail, member list, discussions, posts, ratings) requires view
  access; outsiders get a not-found response instead of content.
- Introduce a single view-authorization step (`group:view` in the policy layer, applied in
  the group service) and make `getDiscussion` tenant-aware so no caller can load a
  discussion across groups.
- Demo login no longer resolves pre-existing accounts and never derives role from the email
  text; demo mode is hard-disabled outside a non-production environment.
- Authentication identity is bound to the provider subject, not email alone, so a demo or
  ticket account cannot be silently inherited by a later Google sign-in.
- Auth settings stop trusting the request host; the canonical origin is pinned.
- Mutation request bodies are size-limited before they are buffered, closing the
  memory-exhaustion path (including the double-buffering in group routes).
- Rate limiting is shared across instances and applied to the authentication endpoints
  (login/OAuth callbacks and registration).
- Authentication outcomes (success and failure) are emitted as redaction-safe audit events.

## Capabilities

### New Capabilities
- `security/group-access`: Who may read a group's content. Restricted groups are readable
  only by members (and administrators); non-members receive a not-found response. Reads are
  enforced in the service layer, and discussion reads are scoped to their group.
- `security/auth-hardening`: Authentication trust and identity. Demo login is limited to a
  non-production allowlist with least privilege and no account impersonation; identity binds
  to the provider subject; the app pins its canonical origin; auth outcomes are audit-logged.
- `security/request-guards`: HTTP mutation guards. Oversized bodies are rejected before
  buffering, and rate limiting is shared across instances and covers the auth endpoints.

### Modified Capabilities
<!-- No existing capability under `openspec/specs/` changes. The project's specs cover only
     `ui/*`; these security behaviors are new capabilities. -->

## Impact

- **Access control:** `src/core/auth/policy.ts` (new `group:view` action),
  `src/modules/groups/service.ts`, `src/modules/discussions/service.ts`,
  `src/app/(app)/groups/[id]/page.tsx`, `src/app/(app)/groups/[id]/admin/page.tsx`.
- **Auth:** `src/modules/auth/auth.ts`, `src/modules/auth/demo.ts`,
  `src/modules/auth/repository.ts`, `src/app/api/auth/[...nextauth]/route.ts`,
  `src/app/api/auth/register/route.ts`.
- **HTTP guards:** `src/core/http/with-route.ts`, `src/core/http/rate-limit.ts`, and the
  group route files that pre-read the body (`groups/[id]/ratings`, `groups/[id]/discussions`,
  `discussions/[id]/posts`).
- **Config/deploy:** `src/core/config/env.ts` (documented production expectations),
  `docker-compose.yml` / `.env.example` (canonical origin and demo-mode notes).
- **Behavioral risk:** seeded restricted group 4 has no members, so a strict guard makes it
  unviewable by everyone until a membership/invite path exists (see design).
- **Tests:** `tests/unit/env.test.ts`, `tests/e2e/group-discussions.spec.ts`, policy unit
  tests, and the dev seed fixtures.
