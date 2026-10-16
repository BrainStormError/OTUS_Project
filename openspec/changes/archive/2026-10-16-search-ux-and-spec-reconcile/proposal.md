## Why

The archived specs drifted out of sync with the code: several `ui/screens`/`ui/navigation` requirements still mandate actor/director filters and a per-episode series model that the TMDB rework removed, so the specs contradict `catalog` and the implementation. At the same time the Home search experience has three gaps users hit in practice — year can only be set one value at a time, a search shows only the first 20 TMDB results with no way to load more, and the genre filter offers film-only genre ids on series searches (e.g. `series&genre=14` always returns nothing because TMDB has no TV genre 14). This change reconciles the specs with the code and lands those three search improvements plus a clearer submit button.

## What Changes

- Reconcile `ui/screens` and `ui/navigation` with the implemented catalog: remove actor/director filters, remove the per-episode series model (season/episode levels and the two-mode rating model), state My Series as whole-series, and draw Home filter options from the stored genre catalog for the selected kind — not "the whole film catalog".
- Replace the single incrementable year filter with a **year range** (from–to) across every search panel that offers a year filter.
- Add **paged search** with an explicit "Показать ещё" control at the end of the results that appends the next page; the API gains a `page` parameter and returns paging metadata.
- Make the genre catalog **kind-aware**: film and TV genres are stored per kind and served per kind, so the genre dropdown offers only ids valid for the selected kind (fixes empty series-by-genre searches). **BREAKING** (data): requires a schema change to the genre catalog.
- Move the "Найти" action from the panel header row to a full-width primary button below the filter grid, in every submit-driven search panel.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui/screens`: Home/submit-button placement, filter set (drop actor/director, year becomes a range), year-range scenarios, paged results with a load-more control, My Films/My Series option sources, My Series whole-series only, shared component inventory without season/episode levels, add-rating search without actor/director.
- `ui/navigation`: navigation depth limit no longer lists season and episode levels.
- `catalog`: kind-scoped search narrows by a year range and returns paged results.
- `catalog/genres`: the genre catalog is stored and served per kind; genre options are drawn from the selected kind's genres.

## Impact

- **Catalog module:** `src/modules/catalog/client.ts` (year range params, `page`, TV vs movie genre lists), `service.ts`, `repository.ts`, `schema.ts`, `types.ts`.
- **API:** `src/app/api/search/route.ts` (`page`, year range), `src/app/api/genres/route.ts` (`kind`).
- **Data:** new migration adding a genre↔kind relation (e.g. `genre_kinds(genre_id, kind)`); `scripts/sync-genres.cjs` upserts both kinds; `scripts/seed-dev.ts` seeds kind membership.
- **UI:** `SearchField.tsx` (range inputs, full-width "Найти", genre options by kind), `HomeView.tsx`, `AddRecordModal.tsx`, `MyFilmsView.tsx`, `MySeriesView.tsx`, `GroupRatings.tsx`, `filters.ts` (local range match), `catalog-view.ts`.
- **Tests:** unit (search schema/params, range matching, genre-by-kind options, paging), integration (`/api/search` paging + range, `/api/genres?kind=`), component tests for the new controls.
- **Specs:** no new capability; four existing specs gain deltas.
