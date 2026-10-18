## 1. Genre reference data split (DB and scripts)

- [x] 1.1 Add a migration creating `film_genres(id, name)` and `series_genres(id, name)` with per-table `UNIQUE(name)`, copying rows from `genres` + `genre_kinds` (kind 0 → film_genres, kind 1 → series_genres, an id in both kinds copied into both), then dropping `genre_kinds` and `genres`; include the down migration that rebuilds the merged schema; verify `migrations.test.ts` passes and the up migration leaves each table with exactly its kind's genres
- [x] 1.2 Update `scripts/seed-dev.ts` to seed both per-kind tables instead of `genres` + `genre_kinds` (same TMDB ids and names per kind); verify the seed runs against a dev database without errors and `/api/genres?kind=` returns the seeded per-kind lists
- [x] 1.3 Update `scripts/sync-genres.cjs` to upsert the movie list into `film_genres` and the TV list into `series_genres` without cross-kind name-collision skips; verify a sync run against a dev database stores every TMDB genre of each list (including previously skipped same-name ids)

## 2. Catalog module per-kind resolution

- [x] 2.1 Rework `src/modules/catalog` repository/service so `listGenres` reads one kind's table, genre-name maps are built per kind, `listKnownGenreIds` is kind-scoped, and the in-process `TtlCache` keeps only the `'film'`/`'series'` keys; verify `catalog-genres-cache.test.ts` and the catalog integration tests pass
- [x] 2.2 Make `resolveSaveMetadata` keep only genre ids present in the media kind's catalog; verify a test where a series reports a film-only genre id and that id is dropped from the saved metadata
- [x] 2.3 Narrow `GET /api/genres` to require the `kind` query (resolving design.md's open question) and return only that kind's catalog; verify the route tests cover both kinds and reject or ignore a missing kind consistently with the schema

## 3. Per-kind genre options in the UI

- [x] 3.1 Change `home-screen.tsx` to load both `/api/genres?kind=film` and `?kind=series` with the screen's initial data and pass the active kind's options to `HomeView`, which swaps the option list when the kind changes without refetching; verify the Home/search unit tests assert the series filter offers only series genres and no extra `/api/genres` request is made after mount
- [x] 3.2 Pass genre options into `AddRecordModal` and `GroupRatings` from their parent screens instead of fetching `/api/genres` on open; verify tests assert the add modal and the group picker offer only the selected kind's genres and make no genres request after opening

## 4. Profile statistics

- [x] 4.1 Change the statistics payload to `{ films, series, genres, years }` in `src/modules/profiles` (films/series counts per kind; genres/years merged distributions sorted by count descending, years tie-broken by newer year) and update `adapters.ts` / `UserStats` accordingly; verify the profiles unit and integration tests assert separate film and series counts
- [x] 4.2 Update `StatisticsView`/`StatCard` to render «Всего фильмов», «Всего сериалов», «Любимый жанр», «Любимый год» plus the two distribution panels, with the favourite-year card reading the most-watched release year; verify a test where a newer release year has fewer entries than an older one and the card shows the older year

## 5. Group statistics

- [x] 5.1 Aggregate the group's rated media (unique media of the Оценки tab: per-kind counts, genre and year distributions over those media) server-side and attach the result to the group read payload in `src/modules/groups`; verify group integration tests assert the stats match the group's ratings
- [x] 5.2 Replace the `EMPTY_STATS` stub in `toGroup` with the computed stats; verify `group-tabs.test.tsx` renders non-empty statistics on the Статистика tab
- [x] 5.3 Verify recalculation end to end: saving a group rating triggers the existing `invalidateReads([groupRead])` refetch and the statistics shown afterwards include the new rating (mutation/invalidation unit test or group integration test)

## 6. Table polish

- [x] 6.1 Add top spacing to the expanded detail cell in `RecordsTable.tsx` so the comment and actions sit below the header row edge; verify `records-table.test.tsx` passes and the expanded content classes include the top padding
- [x] 6.2 Add the watched-list row hover style (`transition-hover hover:bg-secondary`) to `WatchlistTable.tsx` rows; verify `watchlist-view.test.tsx` asserts the hover style on watch-later rows

## 7. Footer

- [x] 7.1 Rework `footer.tsx` to centered rows with the project line, `v1.0`, and the TMDB line («Данные о фильмах и сериалах предоставлены TMDB»); verify a unit test asserts the version, the TMDB phrase, and centered layout classes while `routes.test.ts` still passes

## 8. Timezone removal

- [x] 8.1 Delete `TimezoneSelect.tsx` and its use in `SettingsView.tsx`, keeping `HourCycleSelect` as the only time control; verify the settings tests show no timezone selector
- [x] 8.2 Simplify `src/components/layout/preferences.ts`: drop `TIMEZONE_KEY`, `readTimezone`/`writeTimezone`, and the `setTimeZone` hook API; resolve timestamps and the current date from the browser timezone with a UTC fallback; update `timestamp.tsx`, `RatingForm`, `RecordModal`, and `GroupRatings` call sites; verify `preferences.test.ts`, `format-timestamp.test.ts`, and `timestamp.test.tsx` pass
- [x] 8.3 Verify a previously stored `timezone` localStorage value is ignored (unit test per the spec scenario)

## 9. Full verification

- [x] 9.1 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:integration` and verify all pass
- [ ] 9.2 Run the e2e suite and verify: series search offers only series genres and a selected genre yields results; profile shows two counters and the most-watched favourite year; the group Статистика tab reflects ratings; settings shows no timezone selector; watch-later rows highlight on hover
