## 1. Baseline

- [ ] 1.1 Record the "before" numbers on the VPS with the current deployment: `SELECT count(*) FROM ratings` in three fresh `psql` sessions (`docker compose exec db psql -U postgres -d watcher -c '\timing on' -c "..."`), page TTFB (browser Timing panel), and `docker stats --no-stream` for `app` and `db`. **Verification:** numbers recorded in this task before any code change; reference point from followup 6.2 is 23-371 ms cold `count(*)` and TTFB above ~300 ms.

> Blocked: the "before" numbers require the VPS stand, and direct access to it is forbidden by the user's standing instruction. No code change was deployed, so the stand still runs the pre-change build; the reference numbers from followup 6.2 (23-371 ms cold `count(*)`, TTFB above ~300 ms) remain valid until task 5.1. The user must supply the fresh baseline on the VPS.

## 2. Cache budget

- [x] 2.1 Change `TMDB_CACHE_BUDGET_BYTES` from `100 * 1024 * 1024` to `16 * 1024 * 1024` and `TMDB_CACHE_EVICT_TARGET_BYTES` from `90 * 1024 * 1024` to `14 * 1024 * 1024` in `src/modules/catalog/service.ts`; keep the comment about hysteresis accurate. **Verification:** `npm test` passes; eviction unit tests (`tests/unit/catalog-cache-eviction.test.ts`) still pass since they import the exported constants.
- [x] 2.2 Search the test suite for hard-coded 100 MB / 90 MB budget assertions and update any that do not follow the exported constants. **Verification:** `rg "100 \* 1024|90 \* 1024" tests` returns nothing budget-related; `npm test` passes.

> Correction: `tests/unit/catalog-cache-eviction.test.ts` did **not** pass on the exported constants alone - the row sizes were hard-coded (`30 * MB`, `60 * MB`) against the old 100 MB budget, so at a 16 MB budget the "under budget" case evicted and the hysteresis case removed every row. The sizes were rebased on the exported constants (`TMDB_CACHE_BUDGET_BYTES / 4`, `/ 2`, and `TMDB_CACHE_EVICT_TARGET_BYTES`) and the now-unused `MB` helper was dropped. `tests/integration/catalog-cache-eviction.test.ts` needs no change - it exercises `deleteOldestCache` on byte amounts, not the budget. `rg "100 \* 1024|90 \* 1024" tests` returns nothing; the eviction unit suite passes (7 tests).

## 3. Database buffers

- [x] 3.1 Change `shared_buffers=64MB` to `shared_buffers=128MB` in the `db` service `command:` of `docker-compose.yml`; leave `work_mem=4MB`, `max_connections=20`, and `jit=off` untouched. **Verification:** `docker compose config` renders the new command; the spec scenario "Database starts with small-host budgets" is satisfied.

> `docker compose config` renders `- shared_buffers=128MB`, `- work_mem=4MB`, `- max_connections=20`, `- jit=off`.

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`; all pass. **Verification:** commands complete without errors; record the counts.

> `lint` - 0 errors (2 pre-existing, unrelated `<img>` warnings); `typecheck` - clean; `deps:check` - 0 violations (251 modules); `test` - 649 passed (89 files); `test:integration` - 173 passed (21 files).

## 5. After-measurement

- [ ] 5.1 After deploying, repeat the 1.1 measurements with the same commands and compare against the recorded "before" numbers. **Verification:** difference recorded in this task; expectation per design.md - the cold `count(*)` figure drops from 23-371 ms toward single-digit ms because the working set now stays in `shared_buffers`, and `docker stats` shows the db container's resident memory up by roughly the buffer increase. If the cold figures do not improve, record that and revisit the budget numbers separately - do not silently change `platform/resource-budgets` again.

> Blocked: depends on task 1.1 and on a deploy to the VPS stand, which requires the user (direct access is forbidden). The local code and compose changes are complete and verified; measurement is the only remaining step.

## 6. Application heap

- [ ] 6.1 Change `NODE_OPTIONS` in the `app` service of `docker-compose.yml` from `--max-old-space-size=256` to `--max-old-space-size=320`. **Verification:** `docker compose config` renders `--max-old-space-size=320`; the "Bounded application heap" requirement still holds because the bound does not exceed 320 MB. No spec delta is needed - the requirement caps the bound and does not pin a deployment value.

