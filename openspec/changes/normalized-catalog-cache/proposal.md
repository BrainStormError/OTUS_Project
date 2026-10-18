## Why

Saving a title re-resolves its metadata from TMDB even though the server already received that metadata while rendering the search results. The cache stores raw responses keyed by request, so a search page and a detail response are separate rows and the save path reads only the detail key: a title the user just found in search is unknown to the save path, which then depends on a live TMDB call. When TMDB is slow or unavailable the save fails (`mutation.rejected code=INTERNAL` on `records.upsert`) and the client rolls the change back.

## What Changes

- Split the catalog cache into two row families: a query index (`query:...` holding the ordered identifiers a real TMDB request returned) and title records (`title:{kind}:{externalId}` holding the title's own fields). One title is stored once and shared by every query that returned it.
- Make the query cache key mirror the request actually sent to TMDB: the filters (genre, year) are applied locally for a text search and therefore stay out of the key, while they are part of the request for a filter-only search and therefore stay in it. Query text is normalized to lower case along with trimming and whitespace collapsing.
- Serve search pages and title detail from the title records; a detail open enriches the record with `overview` and a completeness marker.
- Resolve the save-path metadata from the title record instead of a live TMDB request. TMDB is contacted only when no record exists for the title, which is rare: every screen that can trigger a save has already resolved the title.
- Stop writing `director` into the local catalog entry. The column stays; the detail screen reads the director from the live title detail, and no list displays it.
- Give title records a one-month lifetime and query indexes the existing six-hour window.
- Account cache usage and eviction by key plus value, not value alone, so the storage budget describes what the rows actually occupy.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `catalog`: metadata for a saved title is resolved from the cached title record rather than from a live TMDB request; the catalog entry no longer stores a director; the cache holds query indexes and title records.
- `platform/resource-budgets`: the catalog cache budget covers both row families and measures each row as key plus value.

## Impact

- Code: `src/modules/catalog/{cache-key,cache-repository,service,types,domain}.ts`, `src/modules/ratings/repository.ts`, and the save paths in `src/modules/records/service.ts` and `src/modules/watchlist/service.ts` through the shared metadata resolver.
- Tests: unit tests for keys, TTLs, record merging, and eviction accounting; integration tests for search, detail enrichment, and saving without a TMDB request.
- Behavior: saving no longer depends on TMDB; repeated searches and repeated detail opens make no TMDB request; a title record lives far longer than a query index.
- Out of scope: poster caching, dropping the `director` column, hashing cache keys, merging search pages into one row, and sending title metadata from the client.
