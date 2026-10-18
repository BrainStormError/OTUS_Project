## Why

On the single-vCPU host a single read request holds more than one pooled connection at a time: `GET /api/friendships` and `GET /api/groups` each fan out to three queries through `Promise.all`, so one request occupies up to three of the pool's ten connections concurrently. With a routine burst of section reads the pool is exhausted, and the next request fails after the 5-second connection wait with `timeout exceeded when trying to connect`. This is visible in production: read operations (`me.privacy.read`, `friendships.read`, `groups.read`, `me.profile.read`, `me.stats.read`) fail with that error while the browser hides the failures behind its read cache.

Host measurements explain why the failures are intermittent and why the pool is not the only cause:

- A warm query answers in ~3.5 ms, so the SQL itself is cheap.
- Establishing anything new is expensive on this host: `docker compose exec db true` alone takes ~2 s, and a fresh connection plus a trivial query takes 4-6 s with high variance. That is the same order as the app's 5-second connection wait.
- The pool closes its connections after 30 s of idleness (`idleTimeoutMillis`), and reads are cached in the browser for a year, so the first burst after an idle period must re-establish up to ten connections at once — exactly when connection setup is slowest.

## What Changes

- Serialize the multi-step reads in `GET /api/friendships`, `GET /api/groups`, and `GET /api/groups/[id]`: replace the `Promise.all` fan-out with sequential awaits, so one request holds at most one pooled connection at a time.
- Keep the pool's connections established across requests instead of re-establishing them: the pool is sized so that its connections stay open for the lifetime of the process, and they are opened before the first request rather than on demand.
- Raise the pooled-connection acquisition wait from 5 seconds to 10 seconds, so a request that still needs a connection queues instead of failing at the host's measured connection-setup latency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/data-access`: adds a requirement that a multi-step read acquires at most one pooled connection at a time, a requirement that the pool's connections stay established and are reused across requests, and a requirement that the wait for a pooled connection is bounded at 10 seconds.

## Impact

- Code: `src/app/api/friendships/route.ts`, `src/app/api/groups/route.ts`, `src/app/api/groups/[id]/route.ts` (sequential reads), `src/core/db/pool.ts` (connections stay established, `connectionTimeoutMillis`).
- Tests: route tests for friendships, groups, and group detail, plus pool-configuration assertions.
- Behavior: a request that reads several lists may take slightly longer end to end, but no longer occupies several connections at once; a request after an idle period is served without establishing a new connection; a request that still finds the pool busy waits up to 10 seconds instead of 5.
- Resources: ten established Postgres backends cost roughly 50 MB of the host's memory, which has headroom (446 MB available at measurement time) but competes with the file cache that keeps cold reads tolerable.
- Out of scope: pool size, Postgres `max_connections`, database/server tuning, and query speed.
