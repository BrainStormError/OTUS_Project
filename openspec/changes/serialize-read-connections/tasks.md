## 1. Serialize the friendships read

- [x] 1.1 In `src/app/api/friendships/route.ts` replace the `Promise.all([getFriends, getIncomingRequests, getOutgoingRequests])` fan-out with three sequential `await` calls that keep the existing `Result` short-circuit and assemble the same `{ friends, incoming, outgoing }` body. Verify the friendships route handler test passes and asserts all three lists are still returned.
- [x] 1.2 Add or update a test proving the three reads are issued one after another (the next query starts only after the previous resolves) and that the first non-ok result still short-circuits the response.
  - `tests/unit/read-sequencing.test.ts`: asserts the full `{ friends, incoming, outgoing }` body, that at most one read is in flight at a time, and that a non-ok result short-circuits without reading the remaining lists.

## 2. Serialize the group reads

- [x] 2.1 In `src/app/api/groups/route.ts` replace the `Promise.all([getGroups, getDiscoverableGroups, listMyInvitations])` fan-out with sequential `await` calls, keeping the existing short-circuit and the same `{ groups, discover, invitations }` body. Verify the groups route handler test passes.
- [x] 2.2 In `src/app/api/groups/[id]/route.ts` replace the `Promise.all([listDiscussionDetails, listGroupRatings])` fan-out with sequential `await` calls, keeping the existing short-circuit and the same response body. Verify the group-detail route handler test passes and asserts discussions and ratings are still returned.
  - `tests/unit/read-sequencing.test.ts` also covers `GET /api/groups/[id]`: asserts `discussions` and `ratings` are returned, that at most one read is in flight at a time, and that a failed discussions read short-circuits without reading ratings.
- [x] 2.3 Confirm the internal second query in `listGroupsForUser` / `listDiscoverableGroups` (`src/modules/groups/repository.ts`) remains sequential, so the per-request peak is one connection; record the finding in the task. Verify by reading the code path and, if a test exists, that it still passes.
  - Finding: `listGroupsForUser` and `listDiscoverableGroups` (`src/modules/groups/repository.ts:143-169`) each `await query(...)` (rows) before `await membersByGroup(...)`, so both queries run sequentially within one call; the route calls each service exactly once, so after serialization the per-request peak is one connection. `tests/integration/group-members.test.ts` (which exercises `getGroups`) passes: 10 tests.

## 3. Keep the pool's connections established

- [x] 3.1 In `src/core/db/pool.ts` set `min` equal to `max` (`min: 10`) so no connection is closed for idleness. Verify with a test or assertion that the pool is constructed with `min` equal to `max`.
  - `tests/unit/pool-config.test.ts`: asserts `getPool().options.min === 10` and `options.max === 10`. pg-pool only closes idle clients while above `min` (`_isAboveMin`), so `min === max` keeps them for the process lifetime.
- [x] 3.2 Open the pool's connections once at startup, before the first request is served (in the same place the cache sweep is started, `src/instrumentation.ts`), so the first burst does not pay connection setup. Verify a test shows startup establishes the connections and a first query does not open a new one.
  - Added `warmPool()` in `src/core/db/pool.ts` (issues `max` concurrent trivial queries, then leaves the clients established); `src/instrumentation.ts` awaits it before `startCacheSweep()`, non-fatally.
  - `tests/unit/instrumentation.test.ts`: `register()` calls `warmPool()` then `startCacheSweep()`, still starts the sweep when warm-up fails, and does nothing outside the nodejs runtime.
  - `tests/integration/db.test.ts`: after `warmPool()` `pg_stat_activity` shows >= 10 app connections, and a following query does not increase the count.
- [x] 3.3 In `src/core/db/pool.ts` change `connectionTimeoutMillis` from `5_000` to `10_000`. Verify with a test or assertion that the pool is constructed with a 10-second connection timeout.
  - `tests/unit/pool-config.test.ts`: asserts `getPool().options.connectionTimeoutMillis === 10_000`.

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, and `npm test`; verify all pass.
  - Results: `lint` 0 errors (2 pre-existing `no-img-element` warnings in FilmDetail/MovieCard, unrelated); `typecheck` clean; `deps:check` no violations; `test` 99 files / 732 tests passed. Integration `db.test.ts` + `group-members.test.ts` pass (15 tests) against Testcontainers Postgres.
- [ ] 4.2 After deploy, confirm on the host that the pool's connections are present while the app is idle (`SELECT count(*) FROM pg_stat_activity;` shows the app's connections) and that read operations no longer produce `timeout exceeded when trying to connect` under normal section navigation (`docker compose logs app | grep 'timeout exceeded'`), and record the observation.
