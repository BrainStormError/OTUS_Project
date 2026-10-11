## 1. Configuration and schema

- [x] 1.1 Add `TMDB_ACCESS_TOKEN` (server-only, min length 1) to `envSchema` in `src/core/config/env.ts`, verified by an updated env unit test that parsing fails without it and succeeds with it
- [x] 1.2 Add `TMDB_ACCESS_TOKEN` to `.env.example` and to the checks in `scripts/verify-env.ts`, verified by `npm run verify:env` passing
- [x] 1.3 Add a migration adding `media.director varchar(200) NULL` with a matching down migration, verified by `npm run db:migrate` then `npm run db:rollback` succeeding
- [x] 1.4 Re-key the `genres` table so `id` is the TMDB genre id and names are the TMDB localized names, and update `media.genre_ids` usage accordingly, verified by reseeding and an integration test that a rated title's genres match TMDB genre ids
- [x] 1.5 Update `scripts/seed-dev.ts` to use real TMDB ids for media (films and series) and whole-series ratings, verified by `npm run db:seed` followed by an integration check that catalog rows resolve by `(kind, external_ref)`

## 2. Catalog module

- [x] 2.1 Create `src/modules/catalog` with `index.ts`, `types.ts`, `schema.ts`, and a public service surface, verified by `npm run typecheck` and `npm run deps:check`
- [x] 2.2 Implement the TMDB client (bearer token, `language=ru-RU`, `withTimeout`, `Result` returns) for `/search/movie`, `/search/tv`, `/movie/{id}`, `/tv/{id}`, and `/genre/{movie|tv}/list`, verified by unit tests with a mocked `fetch` covering success and failure
- [x] 2.3 Implement kind-scoped search mapping to a stable result shape (kind, external id, title, year, poster URL, external rating, genres), verified by unit tests asserting films and series map correctly and that results are not persisted
- [x] 2.4 Implement kind-aware detail resolution for films and series, verified by unit tests for each kind and for an unknown id returning a not-found result
- [x] 2.5 Implement metadata lookup for saving (title, year, director, genres) with genre mapping by TMDB id, verified by unit tests that known ids map and unknown genre ids are dropped
- [x] 2.6 Add a small TTL cache in front of search and detail, verified by unit tests for a cache hit avoiding a second `fetch` and for expiry
- [x] 2.7 Expose a catalog read of the rated titles for a user and kind for list screens, verified by an integration test against the seeded database

## 3. Rating write path

- [x] 3.1 Change `ratingInput` in `src/modules/ratings/schema.ts` so the client sends only `mediaKind`, `mediaRef`, `rating`, `comment`, and `watchedAt`, verified by a schema unit test rejecting a payload carrying `title`/`year`/`genres`
- [x] 3.2 Enrich metadata server-side in the rating save path via the catalog module before `upsertMedia`, verified by an integration test with a mocked TMDB client that the stored title/year/director/genres match TMDB
- [x] 3.3 Fail closed on unknown titles: no catalog row and no rating are written when TMDB does not recognize the id, verified by an integration test
- [x] 3.4 Make `upsertMedia` server-authoritative on conflict so client input can never overwrite stored metadata, verified by an integration test rating the same title twice and asserting the metadata stays TMDB-derived
- [x] 3.5 Add `GET /api/search` with auth, trusted-origin, rate limit, and a query schema of `kind`, `q`, `genre`, `year`, verified by a route test for a valid search, a missing session (401), and invalid input (400)
- [x] 3.6 Add a detail endpoint or server read that resolves a title by kind and id, verified by a route/read test returning detail for a known id and not-found for an unknown one

## 4. Search and detail UI

- [x] 4.1 Rework `SearchField` to a kind selector plus title, multi-value genre, and single year filters, removing actor and director filters, verified by updated component tests
- [x] 4.2 Point `HomeView` at `GET /api/search` for the selected kind, render results only after "Найти", and load popular titles from TMDB, verified by updated `tests/unit/search.test.tsx`
- [x] 4.3 Update the card component to render TMDB-sourced fields with a poster fallback and a film/series variant, verified by component tests for content and missing poster
- [x] 4.4 Replace the in-code `findMovie` lookup with catalog detail for `/film/[tmdbId]` and add a `/series/[tmdbId]` detail route, verified by page tests for a known film and a known series

## 5. My Films, My Series, and group ratings

- [x] 5.1 Make the My Films add/edit modal search films only and use genre/year filters, verified by updated `tests/unit/screens.test.tsx`
- [x] 5.2 Make My Series whole-series only with series-only add/edit search, verified by new tests asserting no per-episode controls and a series-only search
- [x] 5.3 Add a kind selector to the group add-rating modal and search TMDB for the chosen kind, verified by a component test

## 6. Remove the demo catalog and per-episode logic

- [x] 6.1 Delete `data.ts` and `series-data.ts` and update all importers, verified by `npm run typecheck` and `npm run lint`
- [x] 6.2 Remove the per-episode model (`SeriesRecord` mode, seasons/episodes types, `series-store`, `hashId`/`seriesToMovie`) and use the numeric TMDB series id, verified by `npm run typecheck` and `npm run deps:check`
- [x] 6.3 Remove or rewrite every test that imported the demo catalog or exercised per-episode rating, verified by `npm test` passing

## 7. Documentation and validation

- [x] 7.1 Update `README.md` (Configuration table with `TMDB_ACCESS_TOKEN`, stack notes) and any affected docs, verified by `npm run verify:env` and a review of the README section
- [ ] 7.2 Update the e2e critical path to the new search-and-rate flow, verified by `npm run test:e2e`
- [x] 7.3 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, and `npm run test:integration`, resolving any failures introduced by the change
- [x] 7.4 Run `openspec validate tmdb-catalog --strict` and resolve any reported issues
- [ ] 7.5 Manually verify that searching writes no catalog rows and that rating a result writes exactly one row per title, checked against the database
