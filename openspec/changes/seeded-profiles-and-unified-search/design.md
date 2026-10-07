## Context

See `proposal.md` for motivation. Current constraints that shape the approach:

- The relational store already models every relationship the change needs: `users` (with `handle`, `role`, `profile_hidden`, `stats_hidden`), `friendships`, `groups` + `group_members`, `ratings` (personal when `group_id IS NULL`, group otherwise), `media`, `group_discussions`, `discussion_posts`, `activity_events`. Modules `auth`, `friendships`, `groups`, `discussions`, `ratings`, `activity`, `records` already query it.
- The only reading gaps are identity and personal records: `auth/repository.ts` does not select or expose `handle`, there is no read endpoint for personal records (only `POST /api/records`), and several pages still import in-code constants.
- The film/series catalog (titles, years, genres, actors, directors, posters) has no columns for actors/director/poster in `media`, and this change keeps it as in-code reference data.

## Goals / Non-Goals

**Goals:**

- One source of truth: identity, friendships, memberships, discussions, and personal records come from the store for the signed-in account; in-code constants stop being read by the UI.
- Profiles and statistics are computed from stored ratings and are populated by the development seed for every demo account.
- My Films / My Series read and mutate the account's persisted records.
- Add-rating modals use the Home filter panel with a "Найти" submit; in-list search stays live.
- Modal focus no longer moves while typing.

**Non-Goals:**

- Moving the film/series catalog into `media` or extending the schema with actors/director/poster.
- Reworking group statistics, the activity feed, or friends/groups queries (already store-backed).
- Changing the authentication mechanism or the demo login flow beyond giving new accounts a handle.

## Decisions

### Identity is read from the account, exposed through the existing actor

`resolveActor` already loads the user row. Extend it to carry `name` and `handle`, and add `handle` to the auth user query/type. The header, `/me`, and statistics pages consume the actor instead of `currentUser`. Alternative considered: fetch the user separately in each page; rejected as duplicated queries and a second identity path.

### A profile read model composed from existing modules

Add a profile read that, given an actor and an optional handle, returns identity plus statistics and recent records. Others resolve by `handle` (`findUserByHandle`); own profile uses the actor. Statistics and recent records are derived from `listPersonalRatings(userId)` and the existing statistics computation, honoring `stats_hidden`/`profile_hidden` for non-owners. Alternative considered: a new `profiles` table; rejected because the data already exists in `users` + `ratings`.

### Personal records become server-read

Add `GET /api/records` returning the account's personal ratings, and a delete operation for a record. My Films / My Series receive initial records from their server pages and keep optimistic client updates, matching how friends/groups pages already pass server data into client views. Drop `mergeWithSample`, the sample records, and the local-storage stores. Alternative considered: keep local storage as a cache; rejected — it is exactly the second source of truth this change removes.

### Catalog stays in code; ratings reference it by stable id

`movie-tracker/data.ts` and `series-data.ts` remain the reference catalog. Ratings continue to carry `mediaKind` + `mediaRef`, so `upsertMedia` maps them into `media` without duplicating catalog content. Alternative considered: seed the catalog into `media`; rejected as larger and not required for the reported problems.

### Seed populates linked data for every demo account

Extend `scripts/seed-dev.ts` so each of the six users has ratings across a spread of media (so statistics are non-empty) alongside the existing friendships, memberships, and discussions; keep fixed ids and the truncate/restart behavior so re-runs are deterministic.

### One search panel, two modes

`SearchField` gains an optional filter-visibility prop and keeps its two usage modes: Home-like (submit via "Найти") and live (no submit). The add modals in My Films, My Series, and group ratings use the submit mode over the whole catalog; the series picker omits actor/director because series carry no such data. The in-list panels keep the live mode unchanged. Alternative considered: a separate search component; rejected as duplication of an already shared component.

### Modal focus stabilization

The focus effect in `Modal` depends on `onClose`, which is a new function identity on each parent render, so it re-runs on every keystroke and refocuses the first focusable element (the close button). Fix by keeping the handler in a ref and running the focus/trap setup only on `open` changes, and by focusing the first meaningful control (first input/textarea, else the dialog) rather than the close button.

## Risks / Trade-offs

- [Privacy regressions when profiles become store-backed] → Gate statistics/records on `stats_hidden`/`profile_hidden` for non-owners and keep the existing restricted states.
- [New demo accounts without a handle break `/u/<handle>` links] → Generate a handle (derived from email) when creating a user; enforce non-null in the insert path.
- [Dropping local storage loses users' existing browser records] → Accepted for a demo app; the seed provides data, and the store becomes the source. Document in the change summary.
- [Removing page imports of constants may break unit tests that import `data.ts`] → Update or replace affected tests to use store-backed fixtures where behavior changed, and keep pure helpers (matching, stats) covered.

## Migration Plan

1. App still reads constants until each page is switched; land store-backed reads together with the seed extension so profiles are populated.
2. Re-run `scripts/seed-dev.ts` to load the connected data; it truncates and reseeds deterministically.
3. Rollback: revert the page/endpoint changes; the schema is unchanged and the legacy constants remain until removal, so no data migration is needed.

## Open Questions

None blocking. Endpoint shape for record deletion (path vs query parameter) can follow the existing route conventions during implementation.
