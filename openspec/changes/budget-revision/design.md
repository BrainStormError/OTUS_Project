# Design: budget-revision

## Context

See proposal.md - Why. The numbers being revised were frozen by `runtime-cost-trims` / `runtime-cost-trims-followup` and deferred to a post-measurement decision; the measurement (followup task 6.2) is done. Current state:

- `src/modules/catalog/service.ts:36-37` exports `TMDB_CACHE_BUDGET_BYTES = 100 MB` and `TMDB_CACHE_EVICT_TARGET_BYTES = 90 MB` (90% hysteresis); `sweepCache` evicts `usage - target` bytes, oldest first.
- `docker-compose.yml` runs Postgres with `shared_buffers=64MB`, `work_mem=4MB`, `max_connections=20`, `jit=off`.
- Cache maintenance is already cheap and out of the request path (followup): eviction work is bounded by reclaim bytes, TTL checks do not transfer payloads, sweep runs on a 5-minute timer. The original "sweep reads the whole table" cost is gone.
- Measured on the VPS: `count(*)` on 11 rows takes 23-371 ms in a fresh psql session (cold reads), 0.5-2 ms warm; app container idle at 0.00% CPU while the db container shows 237.98% in the post-deploy snapshot.

## Goals / Non-Goals

**Goals:**

- Keep the `tmdb_cache` working set resident inside `shared_buffers` so first-in-session queries stop paying disk reads.
- Raise the buffer pool using measured RAM headroom (557 MB used of 960 MB before the raise).

**Non-Goals:**

- Changing eviction order, TTL semantics, sweep cadence, or the bounded-eviction shape - all unchanged from the followup.
- Changing `work_mem`, `max_connections`, the app heap bound, or log budgets.
- Postgres-side autovacuum tuning or `pg_stat_statements` - separate concerns.

## Decisions

### 1. Budget 16 MB, hysteresis target 14 MB

Both values live in the two exported constants in `src/modules/catalog/service.ts`; no other code hard-codes them, and the eviction tests import the constants, so they follow automatically. The hysteresis keeps its "stop below the boundary" semantics (was 90% of budget; 14 MB is the value agreed with the user for the 16 MB budget).

**Alternative - budget equal to `shared_buffers` (128 MB):** rejected - the cache must share the buffer pool with app tables, not own it.

**Alternative - no hysteresis (evict to exactly 16 MB):** rejected - reintroduces per-sweep churn at the boundary, which the current design deliberately avoids.

Honest effect sizing: the earlier "sweep reads 6x less" rationale applied to the old windowed-sum eviction and is obsolete. What a 16 MB cache buys now is buffer residency (cold-read elimination), less disk, and less autovacuum work - not a 6x CPU cut.

### 2. `shared_buffers` 64 MB -> 128 MB via compose `command:`

Same mechanism as every other Postgres tuning knob in this project (`vps-resource-budgets` chose `command:` as the single config source). With the cache budget at 16 MB the 128 MB pool comfortably holds cache + users/ratings/media/genres.

**Alternative - 96 MB:** rejected - no measurement supports a middle value; 128 MB is a standard power-of-two step and fits the measured headroom.

**Alternative - `effective_cache_size` tuning instead:** rejected - that only changes planner estimates, not residency.

### 3. No migration, no data change

Shrinking the budget needs no schema or data work: the first sweep after deploy sees usage > 16 MB and evicts down to 14 MB using the existing oldest-first path. Existing rows are untouched until then.

## Risks / Trade-offs

- [Smaller cache -> more TMDB misses] -> TTL stays 6 h and eviction stays oldest-first, so hot entries survive; at current traffic (3 users) the miss cost is a few hundred ms on search reruns only. If measured miss rate becomes a problem, revisit TTL vs budget separately.
- [`shared_buffers` +64 MB on a 1 GB host] -> measured headroom was 403 MB available before the raise; app heap stays bounded at 256 MB. If memory pressure appears, revert is a one-line compose change.
- [Two unarchived changes touch `platform/resource-budgets`] -> this delta modifies different requirement blocks than the followup's ADDED ones; archive `runtime-cost-trims` and `runtime-cost-trims-followup` first (their own coordination note requires it), then this change.

## Migration Plan

1. Change the two constants in `src/modules/catalog/service.ts` and `shared_buffers` in `docker-compose.yml`; update tests only if any assert literal numbers.
2. Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`.
3. Deploy; the first sweep evicts the cache down to 14 MB on its own - no manual step.
4. Measure after (same commands as followup 6.2): first `count(*)` in fresh psql sessions (expect the 23-371 ms cold figure to drop toward single-digit-ms), TTFB of a page, `docker stats` for both containers.
5. Rollback: previous image plus previous compose line. No schema change, so the code rollback is safe on the existing data.

## Open Questions

(none)
