## 1. Cache keys and row shapes

- [ ] 1.1 In `src/modules/catalog/cache-key.ts` replace `searchCacheKey` with a query-index key that mirrors the request sent to the source: free-text search keys on `kind`, text, page and language without genre/year; filter-only search keys on `kind`, genre, year, page and language. Verify a unit test shows a text search with different narrowing produces the same key and a filter-only search does not.
- [ ] 1.2 Replace `detailCacheKey` with the title-record key `title:{kind}:{externalId}`. Verify a unit test asserts the key is stable across runs and distinct per kind.
- [ ] 1.3 Normalize the query text to lower case in addition to trimming and whitespace collapsing. Verify a unit test shows `Матрица` and `матрица ` map to one key.
- [ ] 1.4 Add the row payload types in `src/modules/catalog/types.ts`: a query index (`ids`, `page`, `totalPages`) and a title record (`title`, `year`, `posterPath`, `externalRating`, `genreIds`, `overview?`, `hasDetail`). Verify the typecheck passes.

## 2. Cache read/write helpers

- [ ] 2.1 In `src/modules/catalog/cache-repository.ts` add helpers to read a query index and to check that all title keys of an index exist in one query. Verify a unit test shows a missing title record is reported as absent.
- [ ] 2.2 Add two title-record writes: one that updates the base fields and leaves `overview` and `hasDetail` untouched, and one that writes the full record. Verify a unit test shows a search write does not erase an already stored overview.
- [ ] 2.3 Change `selectCacheUsageBytes` and `deleteOldestCache` so a row's size is its key length plus its stored value length. Verify a unit test shows a long key is counted in the usage.

## 3. Search path

- [ ] 3.1 In `src/modules/catalog/service.ts` rework `searchCatalog` to read the query index, validate that all its title records exist, and assemble the page from those records with genre names resolved from the local genre catalog. Verify a unit test shows a cached page is served without calling the source client.
- [ ] 3.2 On a miss, keep the existing source fetch and then write the query index plus base title records for every returned identifier. Verify an integration test shows a second identical search makes no source request.
- [ ] 3.3 Keep the local narrowing by genre and year and the `hasMore` reporting from the index's `totalPages`. Verify a unit test shows narrowing does not change the cached index.

## 4. Detail path

- [ ] 4.1 Rework `resolveDetail` to serve the stored title record when it carries the full detail, and otherwise fetch once, write the full record, and serve it. Verify a unit test shows a stored record with `hasDetail` true is served without calling the source client.
- [ ] 4.2 Keep the last-known fallback: when the source fails and a stored record exists, serve the stored record. Verify a unit test covers the source failure with a stored record present.

## 5. Save path

- [ ] 5.1 Rework `resolveSaveMetadata` to build the metadata from the stored title record and to contact the source only when no record exists, writing the fetched record before returning. Verify a unit test shows saving a title whose record exists makes no source request.
- [ ] 5.2 Confirm `src/modules/records/service.ts` and `src/modules/watchlist/service.ts` need no change beyond the resolver they already call, and that the source-unknown case still fails the save. Verify the existing save and watch-later tests pass.
- [ ] 5.3 Remove `director` from `SaveMetadata` and make `upsertMedia` in `src/modules/ratings/repository.ts` write `NULL` for it. Verify the typecheck passes and an integration test shows a new catalog entry has no director.

## 6. Lifetimes

- [ ] 6.1 Split the single cache TTL into the query-index window (6 hours) and the title-record window (1 month) in `src/modules/catalog/service.ts`. Verify a unit test shows each family expires on its own window.

## 7. Verification

- [ ] 7.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`; verify all pass.
- [ ] 7.2 Add an end-to-end test that searches for a title and saves it without opening its detail, asserting the save succeeds. Verify `npm run test:e2e:critical` passes against a seeded database.
- [ ] 7.3 After deploy, confirm on the host that a save following a search produces no catalogue request in the application log and that a repeated search produces none, and record the observation.
