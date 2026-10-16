## 1. Database

- [x] 1.1 Add migration `src/core/db/migrations/1710000000014_watchlist.sql` creating table `watchlist (id bigint identity PK, user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE, media_id bigint NOT NULL REFERENCES media ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now())`, a unique index on `(user_id, media_id)`, and a lookup index on `(user_id, created_at DESC, id DESC)`; include the down migration dropping the table. Verify with `npm run db:migrate` then `npm run db:rollback` succeeding without error.

## 2. Watchlist module

- [x] 2.1 Create `src/modules/watchlist/types.ts` and `schema.ts` (`addWatchlistInput` = `{ mediaKind, mediaRef }`, reusing `mediaKinds`) and verify `npm run typecheck`.
- [x] 2.2 Implement `repository.ts`: `upsertWatchlist(tx, userId, mediaId)` (idempotent insert), `listWatchlist(userId, kind)` joining `media` to return id, kind, externalRef, title, year, genres, `createdAt`, `deleteWatchlist(userId, id)`, and `hasPersonalRating(userId, mediaId)`. Verify with a unit/integration test against a test database.
- [x] 2.3 Implement `service.ts`: `addWatchlist(actor, input)` resolving metadata via `resolveSaveMetadata` + `upsertMedia`, rejecting when a personal rating exists, all inside `withTransaction`; `listWatchlist(actor, kind)`; `removeWatchlist(actor, id)`. Verify unknown-title rejection and "already watched" rejection with tests.
- [x] 2.4 Add `src/modules/watchlist/index.ts` re-exporting the public API and verify imports resolve via `npm run typecheck`.

## 3. Rating invariant and catalog

- [x] 3.1 Extend `saveWatchedRecord` in `src/modules/records/service.ts` to delete the matching `watchlist` row for `(actor.id, entry.mediaId)` inside the same transaction after the rating upsert. Verify with a test that rating a watch-listed title leaves no watchlist entry.
- [x] 3.2 Ensure adding to the watch-later list creates the `media` row via the existing enrichment path, so `listCatalog` and watchlist listing resolve title/year/genres. Verify with an integration test that a planned-only title has one `media` row and appears in the watch-later list.

## 4. API

- [x] 4.1 Add `src/app/api/watchlist/route.ts` with `GET` (session-guarded, `?kind`, returns items), `POST` (via `withRoute`, `addWatchlistInput`, rate limited like `records`), and `DELETE` (`?id`). Verify `GET` without a session returns 401 and `POST` adds an entry.

## 5. Client data layer

- [x] 5.1 Add `report-watchlist.ts` with `saveRemoteWatchlist({mediaKind, mediaRef})` and `deleteRemoteWatchlist(id)` mirroring `report-rating.ts`. Verify with a unit test.
- [x] 5.2 Add `useWatchlist(initial)` store mirroring `useWatchedRecords` (`add`, `remove`, keyed by `mediaKey`), with toasts on failure. Verify with a component/unit test.

## 6. Cards and detail page

- [x] 6.1 Add a "Буду смотреть" action to `MovieCard` next to the watched action: toggle on/off, active state while listed, no action when already watched, and a `flex flex-wrap` + `min-w-0` wrapper so both actions never overflow the container. Verify with a component test and a narrow-viewport check.
- [x] 6.2 Add the same action to `FilmDetail`, initialised from the page's watch-later state, wired to the remote add/delete. Verify add/remove and that a watched title cannot be added.
- [x] 6.3 Pass the user's watch-later state from Home (`HomeView` and its page) and the detail pages (`/film/[tmdbId]`, `/series/[tmdbId]`) into the cards/detail, and drop the key from the watch-later store after a successful rating save. Verify the button state persists across reload.

## 7. Tabs in My Films and My Series

- [x] 7.1 Add a shared presentational tab bar component (watched list default, "Буду смотреть" second) with tab semantics reused by both views. Verify accessibility roles/labels in a component test.
- [x] 7.2 Load watch-later entries in `/films` and `/series` pages and pass them into `MyFilmsView`/`MySeriesView`. Verify both datasets render.
- [x] 7.3 Build the watch-later list view: table `Название | Год | Добавлено`, the live filter panel limited to watch-later titles, per-row "Оценить" (opens `RecordModal`; on save removes from the list and adds to the watched tab) and "Удалить" (manual removal, no watched record), and an empty state. Verify each action with tests.

## 8. Verification

- [x] 8.1 Run `npm run lint`, `npm run typecheck`, and `npm run deps:check` and confirm no errors.
- [x] 8.2 Run `npm test` (unit/integration) and confirm the new watchlist tests pass.
- [x] 8.3 Add an end-to-end flow (add from Home, see it on the tab, rate it from the tab, confirm it moved to watched and left the list; manual removal; watched-can't-be-added) and run `npm run test:e2e:critical`.
