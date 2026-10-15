## 1. Container resource budgets (compose)

- [x] 1.1 Add a `logging` block (`driver: json-file`, `options: {max-size: "1m", max-file: "5"}`) to the `app` and `db` services; verify `docker compose config` renders the options on both services so each service's log storage is capped at 5 MB
- [x] 1.2 Set `NODE_OPTIONS=--max-old-space-size=256` in the `app` service environment; verify `docker compose config` renders it and a started container reports an old-space limit no greater than 320 MB
- [x] 1.3 Give the `db` service a `command` with `-c shared_buffers=64MB -c work_mem=4MB -c max_connections=20`; verify after `docker compose up -d db` that `SHOW shared_buffers`, `SHOW work_mem`, and `SHOW max_connections` return the configured values

## 2. TMDB cache size budget

- [x] 2.1 Add a migration creating an index on `tmdb_cache (updated_at)`; verify `npm run db:migrate` succeeds and the index is present in the schema
- [x] 2.2 Add a cache-usage query (sum of `octet_length(payload::text)`) and an oldest-first deletion helper in `src/modules/catalog/cache-repository.ts`; verify unit tests cover the usage value and the deletion order
- [x] 2.3 Extend the existing sweep in `src/modules/catalog/service.ts` to evict the oldest entries while usage exceeds 100 MB, stopping at the ~90 MB hysteresis threshold; verify a unit test shows an over-budget sweep deletes oldest rows and halts at the threshold
- [x] 2.4 Add unit tests proving no eviction happens while under budget, the newest entries survive eviction, and the expired-entry sweep still runs; verify `npm test` passes

## 3. Leaner runner image

- [x] 3.1 Remove npm/yarn (and their cache/link directories) from the `runner` stage in `Dockerfile`; verify `docker build --target runner .` succeeds, no `npm`/`yarn` binary remains in the image, and record the before/after image size from `docker images`
- [x] 3.2 Verify the leaner runner still serves traffic by starting the compose stack locally and confirming `/api/health` returns 200

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, and `npm test`; verify all pass
- [ ] 4.2 After deploy, verify on the host that application RSS stays within the heap budget and swap stays flat using `docker stats` and `free -h`

<!-- Host-level guidance (vm.swappiness, swap sizing) is outside this change's scope;
     it may be added to docs/09-runbook-health.md separately. -->
