## 1. Database schema

- [x] 1.1 Add a migration creating `watched_records` (id, user_id FK, media_kind, media_ref, title, year, genres, rating, comment, watched_at, created_at) with a keyset index; verify `npm run db:migrate` then `npm run db:rollback` applies and reverses it cleanly
- [x] 1.2 Add a migration creating `friendships` (requester_id, addressee_id, status, created_at/updated_at) with uniqueness on the unordered pair; verify up/down migrations run
- [x] 1.3 Add a migration creating `groups` and `group_members` (group_id, user_id, role) with a uniqueness constraint on membership; verify up/down migrations run
- [x] 1.4 Add a migration creating `activity_events` (id, actor_id FK, kind, group_id nullable, target_type, target_id, payload jsonb, created_at) with a `(created_at DESC, id DESC)` index and a trigger that `pg_notify`s the new event on insert; verify an integration test observes the notification
- [x] 1.5 Add a dev-only seed script populating demo users, friendships, groups, memberships, and a few watched records from the existing mock catalog; verify it runs against the local DB and is not wired into migrations

## 2. Activity module

- [x] 2.1 Create `src/modules/activity` with `types.ts` and `schema.ts` for event kinds and list input; verify schema unit tests parse valid input and reject invalid limits
- [x] 2.2 Implement the feed repository query joining `activity_events` to the viewer's accepted friendships and memberships, excluding hidden profiles and restricted non-member groups, ordered by `(created_at, id) DESC`; verify an integration test covers visibility, ordering, and page boundaries
- [x] 2.3 Implement cursor encode/decode for the feed reusing the `directory` domain pattern; verify a unit test round-trips and rejects malformed cursors
- [x] 2.4 Implement the service layer returning `Result` with `recordEvent(tx, event)` for use inside an existing transaction and `listFeed(actor, input)`; verify integration tests show an event persists only when the enclosing transaction commits
- [x] 2.5 Export the module from `index.ts` and run `npm run typecheck`

## 3. Real write paths and domain modules

- [x] 3.1 Implement watched-record upsert (repository + service) that writes the record and records a rating event in one transaction; verify an integration test asserts both rows and no event on failure
- [x] 3.2 Implement friendship accept/decline (repository + service) writing the friendship and recording the acceptance event in one transaction; verify an integration test
- [x] 3.3 Implement group join (repository + service) writing membership and recording the join event in one transaction; verify an integration test
- [x] 3.4 Replace the friends, requests, and groups reads in the UI data layer with server queries; verify the Friends and Groups screens render the seeded rows and existing scoped-search tests still pass

## 4. API and real-time stream

- [x] 4.1 Add `GET /api/feed` returning a keyset page with a next cursor and a "since" mode for reconnect catch-up; verify integration tests cover first page, next page, and catch-up without duplicates
- [x] 4.2 Add `GET /api/feed/stream` as a `ReadableStream` SSE handler backed by one `pg` `LISTEN` connection per process with in-memory fan-out, emitting event ids and a heartbeat; verify a stream test receives an event emitted after subscription and resumes via `Last-Event-ID`
- [x] 4.3 Add mutation routes for watched records, friendship accept/decline, and group join through `withRoute`, emitting the corresponding events; verify integration tests exercise each route and its authorization
- [x] 4.4 Wire the existing UI actions (rating form save, friend request accept, group join) to the new endpoints and refresh the affected views; verify manually that each action updates the screen and produces a feed entry

## 5. Live feed UI

- [x] 5.1 Render `SocialFeed` from a server-fetched first page while keeping the existing empty-state behavior; verify the existing feed unit tests pass against the new source
- [x] 5.2 Add the client `EventSource` subscription that prepends new events, shows a "new entries" indicator, preserves scroll position, and falls back to re-fetching `/api/feed` when the stream fails; verify component tests with a mocked stream cover live arrival and fallback
- [x] 5.3 Add the 5 / 10 / 25 size control that slices the list and grows the container, with vertical scrolling when it overflows; verify a component test asserts the default five and the grown container at 25
- [x] 5.4 Integrate the feed into `HomeView` and confirm the accessibility rules still hold (keyboard operation, >= 44px targets, announced updates)

## 6. Shell brand and statistics

- [x] 6.1 Remove the brand link from `sidebar-rail.tsx` and update `tests/unit/navigation.test.tsx` so the collapse behavior is asserted without relying on the brand text; verify the navigation tests pass
- [x] 6.2 Add the centered clickable brand (icon + "Смотровик", links to Home) to `top-bar.tsx` for both shells with an accessible name; verify a navigation test asserts the link and its Home target
- [x] 6.3 Remove the average-rating card from `StatisticsView` and change the grid to three columns; verify `tests/unit/screens.test.tsx` asserts three cards and no average card in Profile and group statistics
- [x] 6.4 Remove `UserStats.average` from `types.ts`, `computeStats`, and all mock users/groups; verify `npm run typecheck` and updated statistics tests pass
- [x] 6.5 Rename the year statistic label from "Частый год" to "Любимый год"; verify the screens test asserts the new label

## 7. Development CSP

- [x] 7.1 Update `buildCsp` in `src/proxy.ts` to include `'unsafe-eval'` in `script-src` only when `NODE_ENV !== 'production'`; verify `tests/unit/proxy.test.ts` asserts development includes it and production omits it

## 8. Verification

- [x] 8.1 Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run test:integration` and resolve any failures
- [x] 8.2 Run `npm run test:e2e:critical` and confirm Home loads the feed and the shell renders the centered brand
- [x] 8.3 Run `openspec validate "ui-shell-and-live-feed" --strict` and confirm the change is valid
