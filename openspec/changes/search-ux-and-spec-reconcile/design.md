## Context

See `proposal.md` — Why. Current constraints that shape the approach:

- **Search client** (`src/modules/catalog/client.ts`): `searchRaw` always sets `page: '1'` and returns TMDB's `results` (≤20). Year narrowing uses a single value via `searchYearParamFor` (`year` for movies, `first_air_date_year` for TV) and `yearParamFor` (`primary_release_year` / `first_air_date_year`) on `/discover`. Genres are joined with `|` (any-of) after the earlier OR fix.
- **Search service** (`service.ts`): `searchCatalog` caches by `JSON.stringify(input)` and post-filters the single page in memory by exact year (`item.year === input.year`) and by selected genres; `listGenres()` returns the flat stored catalog.
- **Genre data**: a single `genres (id smallint PK, name UNIQUE)` table holds the union of film and TV genres; TMDB film and TV genre ids differ (movie 14 = Fantasy, TV Sci-Fi & Fantasy = 10765), so union options include ids invalid for one kind. `scripts/sync-genres.cjs` upserts both lists keyed by id; `scripts/seed-dev.ts` seeds the union.
- **Search UI** (`SearchField.tsx`): a header row shows the "Поиск" label with the "Найти" button at its right; `YearFilter` is a single incrementable numeric field; the genre dropdown is fed `genreOptionsFromCatalog`. `HomeView`, `AddRecordModal`, `GroupRatings`, `MyFilmsView`, `MySeriesView` all reuse `SearchField`; the live in-list filter match is `filters.ts:movieMatches` (exact year).
- **Specs** were consolidated by archiving; `search-ux-and-spec-reconcile` carries the deltas, including requirements that must now match the shipped code (no actor/director, whole-series only).

## Goals / Non-Goals

**Goals:**
- Narrow search by a year range on both the browse (`/discover`) and title (`/search`) paths.
- Return paged results and let the UI append further pages with an explicit control.
- Separate film and TV genres in storage and offering, so a kind only ever offers valid genre ids.
- Present "Найти" as a full-width primary button below the filter grid everywhere the panel is submit-driven.
- Make the durable specs describe the shipped behavior (reconciliation) without altering that behavior in the deltas beyond the four changes above.

**Non-Goals:**
- Caching the title catalog locally or changing how results are persisted (still not persisted).
- Infinite scroll; the load-more control is explicit.
- Multi-locale genre names or TMDB genre `kind` beyond film/TV.
- Changing the search result shape beyond adding paging metadata and the year-range inputs.
- Reworking the live My Films/My Series filtering into server search.

## Decisions

### D1 — Year range: two optional bounds, mapped per search path
Replace the single `year` with `yearFrom`/`yearTo` in `catalogSearchQuery`, `SearchParams`, and `CatalogSearchInput`. On `/discover`, map to TMDB `primary_release_date.gte/.lte` (film) and `first_air_date.gte/.lte` (TV). TMDB's `/search` (title path) has no date-range parameter, so when a title is present the range is applied in memory alongside the existing genre filter; the in-memory range filter is applied on both paths for one consistent rule. The UI keeps increment/decrement controls on each bound (preserving the incrementable-year behavior) and rejects a lower bound above the upper bound.

- *Why:* `/discover` supports real ranges; the title path does not, so an in-memory range is the only way to honor the requirement there. Keeping both paths on in-memory range filtering avoids two divergent behaviors.
- *Alternatives:* a single year plus an "and later" flag (rejected — does not express an upper bound); a year multi-select (rejected — the requirement is a range).

### D2 — Paging: `page` in, `page` + `hasMore` out
Add `page` (default 1) to the query schema and pass it to TMDB; TMDB returns `page` and `total_pages`. The API returns `{ items, page, hasMore }` where `hasMore = page < total_pages`. Include `page` in the service cache key. The UI renders "Показать ещё" at the end of the results when `hasMore` and appends the next page on activation; a new search resets to page 1.

- *Why:* explicit control (chosen over infinite scroll) is simpler, testable, and matches the requirement wording; `total_pages` gives an authoritative stop.
- *Trade-off:* with in-memory range/genre filtering on the title path, a page can drop items after filtering while `hasMore` is still derived from TMDB paging — the client may need another "Показать ещё" press to surface matches. Accepted and documented; the alternative (looping server-side until a page is non-empty) adds latency and unbounded TMDB calls.
- *Alternatives:* cursor paging (rejected — TMDB is page-based); returning everything (rejected — TMDB caps at page 500).

### D3 — Kind-aware genre catalog via a link table
Add a migration creating `genre_kinds (genre_id smallint REFERENCES genres(id) ON DELETE CASCADE, kind smallint NOT NULL, PRIMARY KEY (genre_id, kind))`. `scripts/sync-genres.cjs` upserts `genres` by id as today and, in the same run, upserts `genre_kinds` for the movie list (kind 0) and the TV list (kind 1). `seed-dev.ts` seeds membership for the seeded ids. The catalog repository gains `listGenres(kind?)`; `/api/genres` accepts `kind` and returns only that kind's genres; `genreOptionsFromCatalog` is fed the kind-scoped list, and each consumer requests the list for its current kind (Home by selected kind, My Films → film, My Series → series, add modal → its kind, group ratings → its kind).

- *Why:* a link table represents a genre that belongs to both kinds (e.g. id 18 Drama) without duplicating rows, and keeps `UNIQUE(name)` intact. This is the correctness fix for `series&genre=14` returning nothing.
- *Alternatives:* a single `kind` column on `genres` (rejected — cannot represent shared ids); a static hard-coded valid-id set per kind (rejected — chosen approach is the link table, variant A).
- *Compatibility:* `/api/genres` without `kind` keeps returning the full catalog; consumers that pass `kind` get the scoped list, so the change is additive for callers.

### D4 — Full-width "Найти" below the filter grid
In `SearchField.tsx`, move the submit button out of the header row into a full-width primary button rendered after the filter grid; the header row keeps only the "Поиск" label (and the kind selector stays where it is). Because every submit-driven usage shares `SearchField`, the change applies to Home and every add-rating/group modal at once.

- *Why:* one shared component gives consistent placement everywhere, matching the requirement.
- *Alternatives:* a Home-only prop toggle (rejected — divergent behavior across the same panel).

### D5 — Spec reconciliation without behavior change
The `ui/screens` and `ui/navigation` deltas restate the requirements to match the shipped code: actor/director filters removed, Home options drawn from the stored catalog for the selected kind, My Series whole-series only, and no season/episode levels in the component inventory or the depth-limit key-screen list. `Series rating model` is REMOVED with reason and migration. Existing scenario names are preserved (the delta validator requires a MODIFIED block not to drop scenarios), with their content rewritten to the reconciled behavior.

- *Why:* the specs must describe what the system does; the deltas also carry the four functional changes so one change lands both.

## Risks / Trade-offs

- [Title-path year range is in-memory, so paging can show sparse pages] → `hasMore` still comes from TMDB `total_pages`; a further "Показать ещё" surfaces more. Documented; no server-side page loop.
- [Genre `kind` backfill depends on the sync running with TMDB reachable] → the sync is best-effort and idempotent; `seed-dev.ts` provides a working dev set, and the link table keeps the previous membership if a sync is skipped.
- [New `genre_kinds` table changes the data model] → additive migration with `ON DELETE CASCADE`; drop on rollback; no existing rows are rewritten.
- [Cache key now includes `page`, growing the search cache] → the TTL cache already bounds by time and key count through normal reuse; page counts are small in practice.
- [Moving the submit button changes a spec'd layout] → the durable `ui/screens` requirement is updated in the same change, so spec and UI stay aligned.
- [`hasMore` can be optimistic on the title path] → client treats it as "more may exist"; the control simply stops appearing when TMDB has no further pages.

## Migration Plan

1. Ship the migration creating `genre_kinds` and the updated sync; run `db:migrate` then the deploy's genre-sync step (and `db:seed` for dev) to populate kind membership.
2. Ship the catalog/API and UI changes together; `/api/genres` stays backward-compatible (no `kind` → full list).
3. Verify: `/api/search` returns `page`/`hasMore` and honors a year range; `/api/genres?kind=series` omits film-only ids; Home/add-modal show a full-width "Найти" and a working "Показать ещё".
4. Rollback: revert the app image and drop `genre_kinds`; the `genres` table is unchanged, so a rollback leaves it valid.

## Open Questions

- None blocking. Whether to later add an idle timeout to the load-more flow or a server-side page loop for the title path can be decided without changing the specs or this approach.
