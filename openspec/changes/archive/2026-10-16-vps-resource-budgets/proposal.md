## Why

A VPS with 1 GB RAM and 2.5 GB swap runs in swap-thrash: with no hard budgets the Node.js heap grows unbounded, Postgres runs with default 128 MB shared buffers, container logs are written without any limit, and the TMDB cache grows without a ceiling - so everything crawls instead of fitting a budget and answering predictably.

## What Changes

- **Node.js heap ceiling.** The application container starts with a `--max-old-space-size` limit so its RSS does not balloon under load and the runtime reclaims its own memory instead of leaning on swap.
- **Postgres sized for a 1 GB host.** `shared_buffers`, `work_mem`, and `max_connections` are set in compose for a small VPS instead of defaults meant for larger hosts.
- **Logs capped at 5 MB per service.** Containers get json-file log rotation (`max-size`/`max-file`), so written log storage is hard-bounded.
- **TMDB cache capped at 100 MB.** The cache sweep becomes size-aware: when the budget is exceeded, the oldest entries are evicted until usage is back under the limit, while the existing TTL sweep and read-through behavior are preserved.
- **Leaner runner image.** The unused npm/yarn bundled in `node:22-alpine` is removed from the runtime layer; the actual gain is confirmed by measuring the image size on the next deploy (CI already prints image sizes).

## Capabilities

### New Capabilities

- `platform/resource-budgets`: behavioral guarantees for resource budgets on the target VPS - a bounded application heap, a size-bounded TMDB response cache that evicts oldest entries, bounded container log storage, and a database memory budget that fits the small host.

### Modified Capabilities

<!-- no existing requirements change: catalog (read-through cache behavior unchanged),
     platform/observability (logs still emitted as structured JSON to stdout),
     platform/runtime-config -->

## Impact

- **Code:** `src/modules/catalog/cache-repository.ts` (size-aware eviction), `src/modules/catalog/service.ts` (invoke eviction from the existing sweep cycle).
- **Infrastructure:** `docker-compose.yml` (`logging` block, `NODE_OPTIONS` for `app`, `command:` with Postgres tuning for `db`), `Dockerfile` (runner layer without npm/yarn).
- **Tests:** unit tests for budget-based cache eviction (eviction order, hysteresis, no eviction below the budget).
- **Data/API:** no database migrations (the `tmdb_cache (expires_at)` index already exists); the HTTP contract is unchanged.
- **Out of repository:** `vm.swappiness=10` and watching `docker stats` go to the runbook and do not block this change.
