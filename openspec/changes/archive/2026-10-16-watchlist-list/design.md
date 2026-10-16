## Context

See proposal.md for motivation. Relevant current state:

- `ratings` is the only personal record; a personal rating (`group_id IS NULL`) means "watched" (`src/modules/ratings/repository.ts`). `media` rows are created by `upsertMedia` during `savePersonalRating` (`src/modules/records/service.ts`, `src/modules/ratings/repository.ts`).
- Screens that save a personal rating: Home cards (`HomeView`), the film/series detail page (`FilmDetail`), and the My Films/My Series add flow (`AddRecordModal` + `RecordModal`). All go through `POST /api/records` -> `saveWatchedRecord`.
- My Films (`/films`) and My Series (`/series`) are server pages that pass `WatchedRecord[]` into client views; filtering/sorting is client-side (`filters.ts`).
- An in-section tab pattern already exists for group pages (`GroupTabs` uses `?tab=` + Suspense); group tabs are server-driven because each panel loads its own data.

## Goals / Non-Goals

**Goals**
- A private watch-later list stored normalized (references `media`), with one entry per user and media.
- Add/remove from Home cards and the detail page; a "Буду смотреть" tab in My Films and My Series with rating and manual removal.
- A server-enforced invariant: a title is never both watched and planned.

**Non-Goals**
- No change to the Profile screen, navigation sections, groups, or the social feed.
- No feed/activity events for watch-later changes.
- No public or friend visibility of the list.

## Decisions

### D1. Storage: dedicated `watchlist` table referencing `media`
Table `watchlist (id, user_id -> users, media_id -> media, created_at)`, unique `(user_id, media_id)`, both foreign keys `ON DELETE CASCADE`. Chosen over storing metadata inline because the project's data model is normalized and id-based, and because it lets the watch-later list reuse the watched-list rendering (title/year/genres resolved from `media`). Cost: `media` rows now exist for planned titles too, which is why the `catalog` requirement was widened (see specs). Alternative rejected: inline snapshot + live TMDB fetch, which duplicates data and breaks when TMDB drops a title.

### D2. Metadata enrichment reuses the rating path
Adding to the list calls `resolveSaveMetadata(kind, ref)` then `upsertMedia(tx, metadata)` inside a transaction, exactly like `savePersonalRating`. This keeps a single media row per title and reuses TMDB enrichment, genre mapping, and the "unknown title rejected" behavior. Alternative rejected: a client-supplied payload, which would violate server-side enrichment.

### D3. Mutual exclusivity enforced in one place per direction
- **Add to list**: within the transaction, reject if a personal rating already exists for `(user, media)` (query `ratings`), else insert `watchlist`. Also reject if a watch-later entry already exists (idempotent via unique constraint / `ON CONFLICT DO NOTHING`).
- **Save rating**: extend `saveWatchedRecord`'s existing `withTransaction` to `DELETE FROM watchlist WHERE user_id = $1 AND media_id = $2` right after the rating upsert. This makes "watch removes from list" atomic and screen-agnostic, satisfying the requirement that it applies from Home, detail, and the add flow.
This is the crux: the invariant lives in the `records` transaction, not in the UI.

### D4. New `watchlist` module and `/api/watchlist` routes, parallel to `records`
`GET /api/watchlist?kind=film|series`, `POST {mediaKind, mediaRef}`, `DELETE ?id=`. Mirrors the `records` module layout (`schema`/`service`/`repository`/`types`) and reuses `withRoute`, `getActor`, and rate limiting like `src/app/api/records/route.ts`. Alternative rejected: bolting a `status` column onto `records`, which would overload the rating API and the `ratings` table with a non-rating state.

### D5. Tabs are client-side; the pages load both datasets
`/films` and `/series` additionally load the user's watch-later entries (kind-scoped, joined to `media`) and pass them to the existing client views. The views render a tab bar (watched list default, "Буду смотреть" second) and switch with local state. Chosen over the group `?tab=` pattern because these lists are already client-side and small, and a tab switch should not refetch or remount the client store. A small shared presentational tab bar is introduced and can later back the group tabs too.

### D6. Client state: `useWatchlist` mirrors `useWatchedRecords`
A `useWatchlist` store plus `save/deleteRemoteWatchlist` helpers. Because a rating removes a watch-later entry on the server, each view that holds watch-later state also drops that key after a successful rating save (optimistic). The tab's "Оценить" reuses `RecordModal`; on save the entry is removed from the list and the watched store is updated (`upsert`), so it appears in the watched tab.

### D7. Filtering on the tab reuses `filters.ts`
`movieMatches` (or a watch-later record matcher) and `genreOptions` are reused; the tab's options are limited to the watch-later titles, matching the watched-list behavior.

### D8. Button layout prevents overflow
The card actions and the detail actions use a `flex flex-wrap` container with `min-w-0`/`gap` and `whitespace` handling so the two buttons wrap or shrink within the card and the detail column instead of overflowing. Covered by a spec scenario.

## Risks / Trade-offs

- **Client state divergence** (rated on Home, watch-later tab elsewhere still shows the entry) -> every save path drops the key from its watch-later store; server deletion is the source of truth on next load.
- **Widened catalog rule** now permits unrated `media` rows -> plain browsing still stores nothing; only rating or watch-later creation writes `media`.
- **Duplicate adds / races** -> DB unique constraint makes adds idempotent.
- **Watch-later list "leaks" into shared data** -> no API returns another user's list; no activity events are written, so nothing reaches friends or groups.

## Migration Plan

1. Add migration `1710000000014_watchlist.sql` (table, unique index, FK indexes); down migration drops the table.
2. No backfill; existing data is unaffected.
3. Rollback: dropping the table reverts to the current behavior; ratings/records are untouched.

## Open Questions

- Whether the shared tab bar should also replace the group `?tab=` tabs later. Deferred; not required by this change.
