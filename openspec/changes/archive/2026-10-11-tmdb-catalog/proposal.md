## Why

The film/series catalog is hard-coded demo data (`movie-tracker/data.ts`, `series-data.ts`), so search only ever covers 8 films and 4 series and cannot grow with real usage. We want users to find and rate any title, backed by a real database (TMDB), while keeping our store small by persisting only the titles users actually rate.

## What Changes

- Remove the in-code demo catalog; all film/series search goes through TMDB only.
- Add a kind selector (tabs **Фильмы / Сериалы**) to the search panel on Home and to the group add-rating modal; My Films and My Series are inherently single-kind and need no selector.
- Reduce the search panel filters to title, genre, and year, all resolved against TMDB. Actor and director filters are removed (TMDB needs separate person-id resolution, which is out of scope here).
- Opening a title shows full detail fetched live from TMDB; this rich data is never persisted.
- Persist only rated titles into the existing `media` table: external id (TMDB id), title, year, director, and genres. Add a `director` column. Map genres to the local `genres` table by TMDB genre id, not by name.
- On save, the client sends only `mediaKind`, `mediaRef`, and the rating/comment/date; the server fetches title/year/director/genres from TMDB itself and never trusts client-supplied metadata.
- Remove per-episode series rating; series are rated as a whole. **BREAKING**: the per-episode rating mode is dropped (may return later).
- Add a server-only TMDB access token to the fail-fast environment schema.
- **BREAKING**: the demo catalog, hand-written series seasons/episodes, and any catalog-derived demo content are removed.

## Capabilities

### New Capabilities

- `catalog`: TMDB-backed search and title-detail resolution, plus the persisted catalog of rated titles (id, title, year, director, genres) that ratings and lists reference.

### Modified Capabilities

- `ui/screens`: The Home search panel gains kind tabs and TMDB-backed title/genre/year filters (actor/director filters removed); the film card is sourced from TMDB and gains series detail; My Films and My Series read the persisted catalog; per-episode series rating is removed in favor of whole-series rating.

## Impact

- Removed: `src/components/features/movie-tracker/data.ts`, `series-data.ts`, and the per-episode model in `series.ts` / series types and stores.
- New: a catalog module (TMDB client + service), a `GET /api/search` route, and `TMDB_ACCESS_TOKEN` in `src/core/config/env.ts`, `.env.example`, and `scripts/verify-env.ts`.
- Changed rating write path: `src/modules/ratings/schema.ts` and `repository.ts` (client no longer sends title/year/genres; server enriches from TMDB), `src/modules/records/service.ts`.
- DB: new migration adding `media.director`; `genres` seeded/mapped against TMDB genre ids; `scripts/seed-dev.ts` updated to real TMDB ids.
- UI: `SearchField`, `HomeView`, `MovieCard`/`FilmDetail`, `MyFilmsView`, `MySeriesView`, `GroupRatings`, `record-store`, `film/[tmdbId]` (film/series-aware detail), series pages.
- Tests: unit suites importing the demo catalog need fixtures; per-episode series tests are removed.
