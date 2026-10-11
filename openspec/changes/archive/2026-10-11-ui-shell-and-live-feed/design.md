## Context

See `proposal.md` for motivation and `specs/activity/feed/spec.md`, `specs/ui/navigation/spec.md`, `specs/ui/screens/spec.md` for the requirements.

Current state that shapes the approach:

- The backend is a layered TypeScript codebase: `src/core/db` (pg `Pool`, `query`, `withTransaction`), `src/core/http` (`withRoute`, `Result`-based handlers, origin check, rate limit), and feature modules under `src/modules/<name>` with `types`/`schema`/`policy`/`repository`/`service`/`index`. Auth resolves an `Actor` from the session via `getActor()`.
- Only PostgreSQL is available (`docker-compose.yml` has a single `db` service plus the standalone app container). There is no Redis or message broker.
- Migrations live in `src/core/db/migrations` as SQL with Up/Down sections. Existing tables: `users`, `directory_entries`. Keyset pagination is already implemented in `directory_entries` via an encoded `(created_at, id)` cursor — the pattern to reuse.
- The "product" layer is a presentation prototype: films/series are an in-code catalog (`data.ts`, `series-data.ts`), while watched records, friends, requests, and groups are mock data or `localStorage` (`record-store.ts`). The Home feed is derived synchronously by `feed.ts:buildFeed()` from those mocks.
- The CSP is built in `src/proxy.ts:buildCsp` with `script-src 'self' 'nonce-...' 'strict-dynamic'` and no `unsafe-eval`; `connect-src 'self'` already permits same-origin `EventSource`.

## Goals / Non-Goals

**Goals:**
- Make activity real and live: persist watched records, friendships, and group memberships; record events atomically; stream them over SSE; keep the feed usable when streaming is unavailable.
- Keep the existing layered-module conventions so the feed is a normal module, not a special case.
- Keep films/series as an in-code catalog; no external media API.

**Non-Goals:**
- No posts, comment threads, or notification center (Phase 2/3).
- No TMDB integration; media metadata stays denormalized.
- No changes to series persistence — series records remain in `localStorage`.
- No horizontal-scale write fan-out; read-time feed is sufficient for Phase 1.

## Decisions

**D1. Persist the social domain in PostgreSQL.** Add migrations for `watched_records`, `friendships`, `groups`, `group_members`, and `activity_events`. `users` already exists; the new tables reference it. Alternative: keep mock/localStorage sources and synthesize a feed — rejected because it cannot be "live" or move to production.

**D2. Films stay an in-code catalog; records and events carry a denormalized media snapshot.** `watched_records` stores `media_kind`, `media_ref` (tmdb id or series id), and a snapshot of `title`, `year`, `genres`, plus `rating`, `comment`, `watched_at`. `activity_events.payload` carries the strings the feed renders. This avoids a media table and a TMDB dependency. Alternative: a `media` table populated from TMDB — out of scope.

**D3. `activity_events` is append-only and written in the same transaction as the domain change.** Columns: `id`, `actor_id`, `kind`, `group_id` (nullable), `target_type`, `target_id`, `payload jsonb`, `created_at`. A service helper records the event inside the existing `withTransaction` used by the rating, friendship-accept, and group-join services, so an event exists iff the action committed. Reserved `kind` values leave room for future post/comment events without schema change. Alternative: a separate outbox table with an async publisher — rejected for Phase 1 as extra machinery with no current consumer.

**D4. Real-time delivery over SSE, backed by `pg LISTEN/NOTIFY`.** Each app process opens one dedicated `pg` connection that `LISTEN`s on an `activity_events` channel; a database trigger (or an explicit `pg_notify` in the recording transaction) publishes the new event id on commit. The `GET /api/feed/stream` Route Handler returns a `ReadableStream` and fans the notification out to that process's open subscribers. Because `NOTIFY` broadcasts to every listener, multiple app instances sharing the database all receive events without Redis. Alternatives: WebSocket (Next.js Route Handlers cannot host it without a custom server), polling only (weaker liveness), Redis pub/sub (new infrastructure for no gain at this scale).

**D5. The feed is read-time (pull), not write-time fan-out.** A keyset query joins `activity_events` to the viewer's accepted `friendships` and `group_members`, filters out hidden/restricted sources, and returns pages ordered by `(created_at, id) DESC`, reusing the existing cursor encoding. Alternative: a per-user inbox materialized on write — deferred; it only pays off at much higher volume.

**D6. Film watched-record writes move to the server; the film `localStorage` record store is retired.** The rating form posts to a records endpoint that upserts `watched_records` and emits the event; My Films reads the server. This is required for ratings to appear live. The series store (`series-store.ts`) is untouched. Alternative: keep `localStorage` and also post to the server — rejected because two sources of truth diverge.

**D7. Friend acceptance and group join become server mutations.** `FriendRequestsView` accept/decline and the group-join action call new `withRoute` endpoints that write `friendships`/`group_members` and emit events, then refresh. Reads for the friends and groups screens come from the new tables.

**D8. The live feed client is a server-rendered first page plus an `EventSource`.** `SocialFeed` renders the first page on the server, opens `EventSource('/api/feed/stream?cursor=...')`, prepends new events, and preserves scroll position by keeping the existing first item as a scroll anchor and showing a "new entries" indicator instead of jumping. A 5 / 10 / 25 control slices the list and the container's max height grows with the selection. `connect-src 'self'` already allows the stream. Alternative: a client-only fetch on mount — rejected because it loses SSR and worsens first paint.

**D9. Shell and statistics changes are direct UI deltas.** Move the brand link from `sidebar-rail.tsx` into a centered `top-bar.tsx` slot (both shells); `TopBar` stays server-rendered. Remove the average-rating `StatCard` and switch the grid to three cards; delete `UserStats.average` from `types.ts`, `computeStats`, and mock data. Film `Movie.rating` and series averages are unrelated and stay.

**D10. The development CSP allows `eval()`, production does not.** `buildCsp` conditionally adds `'unsafe-eval'` to `script-src` when `process.env.NODE_ENV !== 'production'`, restoring React's development tooling. A unit test asserts production output omits it.

## Risks / Trade-offs

- [Retiring the film `localStorage` store touches My Films, Home search, and their tests] → Keep the `useWatchedRecords` hook signature as the seam, change only its implementation to read the server, and update tests alongside.
- [SSE holds one dedicated `pg` listener connection per process] → Exactly one listener per process with in-memory fan-out; account for it in pool sizing and document it.
- [Missed events across a stream drop] → The stream sends each event id as the SSE event id and supports `Last-Event-ID`; the client also re-fetches `/api/feed` on reconnect to close gaps.
- [Visibility leaks (hidden profiles, restricted groups)] → Enforce audience rules in SQL and cover them with integration tests against a real Postgres (testcontainers is already a dependency).
- [Seed data reaching production] → Demo users/friendships/groups/records are inserted by a dev-only seed script, not by a migration.
- [Ordering ties on identical timestamps] → Always order by `(created_at, id)` and cursor on both.
- [CSP regression reintroducing the eval error in production or losing the fix in development] → Unit test both NODE_ENV branches.

## Migration Plan

1. Add additive migrations for the five tables, their indexes, and the notify trigger; each has a Down section.
2. Add a dev-only seed script that reuses the existing mock catalog to populate demo users, friendships, groups, memberships, and a few watched records; run it manually in development.
3. Land backend first (module, endpoints, SSE) with the feed module tested in isolation.
4. Wire the UI: rating form, friend accept, group join, `SocialFeed`, then the shell brand, statistics cleanup, and the dev CSP fix.
5. Rollback: revert UI commits and run the migration Down sections; the feed degrades to polling if the stream endpoint is unavailable, so a partial deploy stays functional.

## Open Questions

- Exact demo seed contents (which mock users/groups/friendships to insert) — fill during implementation; does not affect specs or approach.
- Whether to keep `useWatchedRecords` as a thin optimistic cache over the server or remove local caching entirely — implementation detail behind the same hook; behavior is unchanged either way.
- Stream heartbeat interval and reconnect backoff constants — tune during implementation.
