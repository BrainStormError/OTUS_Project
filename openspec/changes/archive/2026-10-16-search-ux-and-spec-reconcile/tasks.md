## 1. Genre catalog by kind

- [x] 1.1 Add a migration creating `genre_kinds (genre_id smallint REFERENCES genres(id) ON DELETE CASCADE, kind smallint NOT NULL, PRIMARY KEY (genre_id, kind))` with a matching down migration; verify `npm run db:migrate` then `npm run db:rollback` succeed
- [x] 1.2 Update `scripts/sync-genres.cjs` to upsert `genre_kinds` membership for the movie list (kind 0) and the TV list (kind 1), idempotently; verify a second run leaves `SELECT count(*) FROM genre_kinds` unchanged
- [x] 1.3 Seed kind membership for the seeded genre ids in `scripts/seed-dev.ts`; verify `npm run db:seed` populates both kinds
- [x] 1.4 Add `listGenres(kind?)` to `src/modules/catalog/repository.ts` returning only the requested kind's genres; verify a query/integration test returns series genres without film-only ids
- [x] 1.5 Update `GET /api/genres` (`src/app/api/genres/route.ts`) to accept an optional `kind` and return the scoped list; verify a route test that `?kind=series` excludes a film-only genre id

## 2. Search year range

- [x] 2.1 Add `yearFrom`/`yearTo` to `catalogSearchQuery`, `SearchParams`, and `CatalogSearchInput`; verify schema unit tests accept a range and reject a lower bound above the upper bound
- [x] 2.2 Map the range to TMDB `/discover` date params (`primary_release_date.gte/.lte`, `first_air_date.gte/.lte`) and apply the same in-memory range filter on both the discover and title paths; verify unit tests for the discover URL params and for title-path range filtering
- [x] 2.3 Include the range in the search cache key; verify a range search caches separately from an unfiltered one

## 3. Search paging

- [x] 3.1 Add `page` (default 1) to the query schema and service input, pass it to TMDB, return `page` and `hasMore = page < total_pages`, and include `page` in the cache key; verify unit tests for the first page, a following page, and the last page

## 4. Search API

- [x] 4.1 Update `GET /api/search` (`src/app/api/search/route.ts`) to accept `page` and the year range and return `{ items, page, hasMore }`; verify route tests for a paged request and for an invalid range (400)

## 5. Search UI

- [x] 5.1 Move the "Найти" action in `src/components/features/movie-tracker/SearchField.tsx` to a full-width primary button below the filter grid, leaving only the "Поиск" label in the header row; verify a component test asserts the button placement and label
- [x] 5.2 Replace the single year field with a from–to range (two incrementable numeric inputs, optional bounds, inverted-range guard) and update the active-filter chips accordingly; verify component tests for optional bounds, narrowing, and the inverted-range guard
- [x] 5.3 Feed the genre dropdown the kind-scoped list by requesting `/api/genres?kind=` for the current kind in `HomeView`, `AddRecordModal`, `GroupRatings`, `MyFilmsView`, and `MySeriesView`; verify a component test that the series panel requests and shows the series genre set

## 6. Load more results

- [x] 6.1 Render "Показать ещё" at the end of the Home results and the add-modal picker, append the next page on activation, and reset to page 1 on a new search; verify component tests for appending a page and for the reset

## 7. Live list filtering

- [x] 7.1 Update `SearchFilters` and `movieMatches` in `src/components/features/movie-tracker/filters.ts` to match a year range for My Films/My Series live filtering; verify unit tests for in-range, out-of-range, and unbounded cases

## 8. Verification and spec alignment

- [x] 8.1 Confirm the implemented behavior matches the delta specs and run `openspec validate "search-ux-and-spec-reconcile" --strict`; verify it is valid
- [x] 8.2 Run `npm run lint`, `npm run typecheck`, and `npm run deps:check`; verify all pass with no new boundary violations
- [x] 8.3 Run `npm test` and `npm run test:integration`; verify the new search, paging, and genre-by-kind tests pass
- [x] 8.4 Walk the running app: set a year range on Home, load more than 20 results, confirm the series genre filter offers only TV genres (no film-only ids), and confirm the full-width "Найти"; verify against the dev-seeded app
