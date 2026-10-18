## Context

See `proposal.md` - Why. The relevant current state:

- `tmdb_cache` is a generic key-value store keyed by `cache_key`, holding raw source responses under `searchCacheKey` (`src/modules/catalog/cache-key.ts:16-37`) and `detailCacheKey` (`:40-44`). The two key families never meet: a title found by search is stored inside a page row and is invisible to the detail key.
- `searchRaw` (`src/modules/catalog/client.ts:124-153`) sends only the free-text query and the page for a text search; genre and year narrowing are applied afterwards in `searchCatalog` (`src/modules/catalog/service.ts:165-173`). A filter-only search goes through `/discover` and does send the criteria.
- `saveWatchedRecord` (`src/modules/records/service.ts:17`) and the watch-later add (`src/modules/watchlist/service.ts:24`) both call `resolveSaveMetadata`, which resolves the title through the detail key and therefore contacts TMDB. This is the observed failure: `mutation.rejected code=INTERNAL` on `records.upsert`.
- Cache budget is 16 MB measured as `SUM(payload_bytes)`, and `payload_bytes` is `octet_length(payload::text)` (`cache-repository.ts:28-35`) - the key is not counted at all.
- `director` is written into `media` (`ratings/repository.ts:62-87`) and read back into list rows, but only `FilmDetail.tsx:106-108` displays it, and that screen receives the director from the live title detail, not from `media`.

## Goals / Non-Goals

**Goals:**

- A title's data is stored once and reused by search, detail, and the save path.
- Saving a title never contacts the catalogue source while a record for that title exists.
- Repeated searches and repeated detail opens make no source request.
- The storage budget describes what the rows actually occupy.

**Non-Goals:**

- Caching poster images.
- Dropping the `director` column from `media`; only its writes stop.
- Hashing cache keys.
- Merging several result pages into one row.
- Sending title metadata from the client.
- Changing the mutation request contract, which stays `mediaKind, mediaRef, rating, comment, watchedAt`.

## Decisions

### 1. Two row families in the existing table

`query:{kind}|<request>` holds `{ ids, page, totalPages }`; `title:{kind}:{externalId}` holds `{ title, year, posterPath, externalRating, genreIds, overview?, hasDetail }`. The table already stores arbitrary keys and jsonb values, so no migration is needed and the eviction machinery keeps working on both families.

**Alternative - two typed tables (query indexes and titles):** rejected. Clearer SQL, but it costs a migration, splits the eviction accounting across two tables, and buys nothing measurable at this scale.

**Alternative - one row per query accumulating pages:** rejected. It needs read-modify-write (a race with two open tabs), loses the ability to answer a single page, and saves only one small row per page.

### 2. The query key mirrors the request actually sent to the source

For a text search the key is `kind`, text, page and language; genre and year stay out of it because they are applied locally. For a filter-only search they are part of the request and therefore part of the key. This removes duplicate rows and duplicate source calls for the same text under different narrowing.

**Alternative - keep every input in the key (current behaviour):** rejected. Two keys for one identical source request, so the same page is fetched and stored twice.

### 3. Query text is normalized to lower case

Alongside trimming and whitespace collapsing, the text is lower-cased. The source search is case-insensitive, so `Матрица` and `матрица` are the same request.

**Alternative - keep case distinct (current behaviour):** rejected. It splits one request into two rows and two source calls for no difference in results.

### 4. A query index is valid only while all its title records exist

Reading a page first checks that every identifier in the index has a title record; if any is missing the index is treated as a miss and the request is repeated, which rewrites both families. This keeps a page from serving with holes after eviction.

**Alternative - serve the page from whatever records remain:** rejected. It changes the page contents and the reported page size.

### 5. Title records are merged, not overwritten

Search writes the base fields and never touches `overview` or `hasDetail`; detail writes the full record. Without this, a repeated search would erase the detail a previous open had added.

**Alternative - replace the whole record on every write:** rejected. It loses the enrichment and forces a source request on the next open.

### 6. TTLs differ per family

Title records keep a one-month window; query indexes keep the existing six-hour window. Title metadata is stable, while the ordering of a result page is not.

### 7. Storage accounting covers key and value

Usage and eviction add the key length to the stored value length. Without this the 16 MB bound understates real occupancy, and long query keys are free.

### 8. `director` is no longer written

`SaveMetadata` loses the field and `upsertMedia` writes `NULL`. The column and the list read stay, so old rows keep their value and nothing visible changes.

**Alternative - drop the column in a migration:** rejected for now. It is a data-destroying change with no visible benefit while the field is already unused.

### 9. The record stores `posterPath`, not the poster URL

The URL is rebuilt on read. If posters are ever served from the application's own origin, the cache does not need rewriting.

## Risks / Trade-offs

- [A record can be evicted between rendering a title and saving it] -> the save path falls back to a source request, which is the rare path rather than the normal one.
- [A one-month TTL can serve outdated metadata] -> the source's title data is stable; the window is one constant if it needs tightening.
- [Query indexes and title records share one budget] -> a long query key can now compete with title records; measured as key plus value, realistic usage is far below the bound.
- [Lower-casing merges two previously distinct keys] -> existing rows with mixed case simply expire; no data is lost.
- [Integration tests currently exercise the old read-through shape] -> they are updated together with the code.

## Migration Plan

1. Change the cache keys, the read/write helpers, the search, detail and save paths, and the size accounting; stop writing `director`.
2. Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`.
3. Deploy the application only; no schema, data, or dependency change. Old cache rows simply expire or are evicted.
4. Verify on the host that a save after a search logs no catalogue request, and that a repeated search makes none.
5. Rollback is a code revert; the cache is a cache, so nothing has to be undone.
