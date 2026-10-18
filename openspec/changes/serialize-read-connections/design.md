## Context

See `proposal.md` - Why for motivation and the host measurements. The relevant current state:

- `src/app/api/friendships/route.ts:27-31` and `src/app/api/groups/route.ts:27-31` build their responses with `Promise.all` over three service calls, so one request checks out up to three pooled connections simultaneously. The groups path is heavier still: two of its three service calls each run a second query internally (`src/modules/groups/repository.ts:143-169`). A third route has the same shape: `src/app/api/groups/[id]/route.ts:39` runs `Promise.all([listDiscussionDetails, listGroupRatings])`.
- `src/core/db/pool.ts:14-18` configures one shared pool with `max: 10`, `idleTimeoutMillis: 30_000`, and `connectionTimeoutMillis: 5_000`. Postgres runs with `max_connections=20` (`docker-compose.yml`).
- The host is one vCPU and its process/connection setup is slow and variable: 4-6 s for a fresh connection plus a trivial query, against a 5-second connection wait. Queries themselves are cheap once warm (~3.5 ms; ~600 ms for a cold read).
- Reads are cached in the browser for up to a year, so the server sees bursts separated by long idle periods - which is exactly when the pool has closed its connections and must re-establish up to ten at once.

## Goals / Non-Goals

**Goals:**

- One read request holds at most one pooled connection at a time, so a burst of reads cannot exhaust the pool on its own.
- Serving a request does not require establishing a new database connection.
- A request that still finds the pool momentarily busy waits longer before failing.

**Non-Goals:**

- Changing the pool size, Postgres `max_connections`, or the database server.
- Making individual queries faster (cold-read and disk work is separate).
- Merging the separate queries into a single SQL statement (deferred; sequential execution is enough to bound connection use).
- Serializing writes or transactions.

## Decisions

### 1. Serialize the reads with sequential awaits, keeping the same queries and mapping

In each of the three affected routes, replace `Promise.all` over its service calls with sequential `await` calls. The queries, their SQL, and their result mapping are unchanged; only the timing of acquisition changes.

**Alternative - merge the three reads into one SQL statement (A1):** rejected for now. It would reach one connection per request as well, but it couples several result shapes into one query, complicates the repository, and risks a different plan; sequential execution already meets the requirement and is a strictly smaller change. On a loopback socket the extra round trips cost well under a millisecond, so merging buys almost nothing.

**Alternative - keep `Promise.all` and raise the pool size:** rejected. On one core the queries serialize on the CPU anyway, so the parallelism shows no latency benefit while multiplying the connection cost; a larger pool only increases contention and memory use.

**Why this is cheap here:** the host has one core, so the parallel reads were already effectively serialized by the CPU. Sequential execution removes the connection cost of the parallelism without removing any real speed.

### 2. Keep the pool's connections established: `min` equal to `max`, warmed at startup

Set `min: 10` alongside the existing `max: 10` in `src/core/db/pool.ts`. In `pg-pool`, idle clients are closed only while the pool is above `min` (`_isAboveMin`), so with `min` equal to `max` no connection is ever closed during the process lifetime and every query reuses an established connection. Because `min` does not pre-create clients, also open the pool's connections once at startup, before the first request is served.

**Why `min` equal to `max` rather than a few:** the measured cost is in establishing a connection (seconds), not in holding one (~5 MB per Postgres backend). Ten backends cost about 50 MB against 446 MB available at measurement time. Eliminating setup entirely is worth that, and the value is a single number to reduce if memory pressure appears.

**Alternative - `min: 3` with `idleTimeoutMillis` raised:** rejected. It leaves the first burst after a long idle period partly dependent on new connections, which is the exact moment connection setup is expensive and the pool has failed.

**Alternative - raise `idleTimeoutMillis` alone (keep `min: 0`):** rejected. Longer idle retention delays the same failure rather than removing it; after an idle period longer than the timeout the burst still pays full setup cost.

**Alternative - a connection pooler (pgBouncer) between app and Postgres:** rejected for this change. It would multiplex connections, but the activity feed uses `LISTEN`/`NOTIFY` on a dedicated client, which requires session-mode pooling and a second route; that is a larger change than the problem needs.

### 3. Raise `connectionTimeoutMillis` from 5s to 10s

Change the single value in `src/core/db/pool.ts`. With connections kept established this is a safety net rather than the main lever: it covers the remaining cases that still need a connection, such as a Postgres restart re-filling the pool, where the host's measured setup latency is several seconds.

**Alternative - leave 5s:** rejected. It is below the host's measured connection-setup latency, so a request that legitimately needs a new connection fails instead of waiting.

**Alternative - unbounded wait:** rejected. A request must still fail predictably rather than hang.

### 4. Sequential order follows the existing response shape

The order of the awaits matches the order the fields are assembled today, so the response body is identical and only latency characteristics change. Error handling keeps the existing `Result` short-circuit (first non-ok result is returned).

## Risks / Trade-offs

- [A multi-list request may be slightly slower end to end] -> On one vCPU the queries were effectively serialized by the CPU already, so the wall-clock difference is small; the requirement's benefit is connection stability, not latency.
- [Ten established backends cost memory that competes with the file cache] -> Cold reads already cost ~600 ms and are served better when the file cache is large; if swap grows or cold reads slow further, lower `min` and the behaviour degrades gracefully back toward lazy connections.
- [A Postgres restart re-establishes all ten connections at once] -> One burst of setup at a rare event; the raised 10-second wait absorbs more of it, and the pool rebuilds itself.
- [The pool config is a code constant, not an env value] -> Adjusting `min` requires a deploy; acceptable for a value that changed only when measurements justify it.
- [Tests that assert parallel invocation or the 5-second value] -> Update them together with the code.

## Migration Plan

1. Change the three routes and the pool values (`min`, startup warm-up, `connectionTimeoutMillis`); update affected tests.
2. Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`.
3. Deploy the application only; no schema, data, or dependency changes.
4. Verify on the host that `pg_stat_activity` shows the pool's connections present while idle, and that read operations no longer log `timeout exceeded when trying to connect`.
5. Rollback is a code revert: restoring `Promise.all`, the previous pool values, and removing the warm-up returns the previous behavior immediately.
