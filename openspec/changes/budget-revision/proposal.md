# Proposal: budget-revision

## Why

VPS measurements show Postgres burning CPU while the app idles (237% CPU in the post-deploy snapshot) and cold queries taking 23-371 ms on tiny tables: the `tmdb_cache` budget (100 MB) is larger than Postgres `shared_buffers` (64 MB), so the cache working set never stays resident and every warm-looking query becomes a disk read. The `runtime-cost-trims-followup` change deferred this numeric revision explicitly ("revisit numbers after measurement"); its trigger condition (TTFB still above ~300 ms after the trims) has now fired.

## What Changes

- **`tmdb_cache` budget 100 MB -> 16 MB.** `TMDB_CACHE_BUDGET_BYTES` and the eviction target (hysteresis 90 MB -> 14 MB) shrink so the cache fits inside `shared_buffers`. One-line constant change plus the budget requirement in `platform/resource-budgets`.
- **Postgres `shared_buffers` 64 MB -> 128 MB.** The `db` service command in `docker-compose.yml` raises the buffer pool so the database keeps catalog and app tables resident on the 1 GB host (measured usage was 557 MB of 960 MB before this raise).
- **Not changed:** eviction order (oldest by `updated_at` first), TTL sweep behavior, eviction cost shape (bounded by bytes, not table size), `work_mem=4MB`, `max_connections=20`, app heap bound.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform/resource-budgets`: the "Bounded catalog cache storage" requirement moves from a 100 MB budget to 16 MB (hysteresis to 14 MB); the "Database memory fits the small-host budget" requirement moves from 64 MB to 128 MB shared buffers. Behavior (oldest-first eviction, TTL sweep preserved, no eviction under budget) is unchanged.

## Impact

- **Code:** `src/modules/catalog/service.ts` (`TMDB_CACHE_BUDGET_BYTES`, `TMDB_CACHE_EVICT_TARGET_BYTES`).
- **Infra:** `docker-compose.yml` — `shared_buffers=128MB` in the `db` service `command:`.
- **Tests:** unit/integration cache-eviction tests that reference the budget constants or assert the 100 MB/90 MB thresholds (`tests/unit/catalog-cache-eviction.test.ts`, `tests/integration/catalog-cache-eviction.test.ts`) — expected to pass unchanged if they use the exported constants; update any hard-coded numbers.
- **Coordination:** revises numbers frozen by `runtime-cost-trims` / `runtime-cost-trims-followup` (both must be archived first or merged at archive time — their `platform/resource-budgets` delta touches the same requirement).
- **Measurement:** before/after comparison on the VPS (first `count(*)` in a fresh psql session, TTFB, `docker stats`) as recorded in followup task 6.2.
