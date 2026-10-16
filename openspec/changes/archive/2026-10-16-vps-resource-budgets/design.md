## Context

See `proposal.md` - Why. Current state relevant to the approach:

- The application runs from `node:22-alpine` via `.next/standalone` (`Dockerfile`, `CMD ["node", "server.js"]`) with no heap bound; idle RSS in production was observed at ~117 MB and grows under load.
- `docker-compose.yml` declares `app` and `db` with health checks, but no `logging` block: the default `json-file` driver has no size limit, so container logs grow on disk without bound.
- `db` uses the `postgres:16-alpine` defaults (`shared_buffers` 128 MB) plus the app's `pg` pool (`max: 10`, `src/core/db/pool.ts:15`) and a dedicated `LISTEN` connection (`src/core/db/activity-channel.ts:46`) - roughly a dozen concurrent connections on a 1 GB host.
- The TMDB response cache lives in the `tmdb_cache` table (`src/core/db/migrations/1710000000015_create_tmdb_cache.sql`) with a 6-hour TTL (`TMDB_CACHE_TTL_MS`, `src/modules/catalog/service.ts:22`). Expired rows are swept opportunistically at most every 5 minutes (`CACHE_SWEEP_INTERVAL_MS` + `sweepExpiredIfDue`, `service.ts:24-34`) via `deleteExpiredCache` (`src/modules/catalog/cache-repository.ts:43`). Nothing bounds the size of the live (non-expired) set.
- The runner image already copies only `.next/standalone`, `.next/static`, and `public`; `node:22-alpine` still carries npm/yarn, which the runtime never uses.
- Every route is `dynamic = 'force-dynamic'`, so Next.js fetch/ISR caching is effectively unused; the TMDB cache is the only cache with unbounded growth. The `TtlCache` class in `src/modules/catalog/cache.ts` is not used in production code (tests only).

## Goals / Non-Goals

**Goals:**

- Keep the whole stack within the 1 GB RAM budget so the host stops swapping under normal load.
- Hard-bound log storage (5 MB per service) and TMDB cache storage (100 MB).
- Change no application behavior visible to users, and keep the cache read-through contract intact.
- Keep the number of moving parts small: no new services, no new runtime dependencies.

**Non-Goals:**

- Host-level swap/zram reconfiguration (runbook guidance only, outside the repository).
- Registry-based image delivery or reworking the CI/CD pipeline.
- Next.js data cache, rate-limiter map, or `react.cache` tuning (negligible or already bounded).
- Compressing static assets or introducing a CDN.

## Decisions

- **Heap ceiling via `NODE_OPTIONS=--max-old-space-size=256` on the `app` service.** Rationale: it bounds RSS with one compose line and no code change; GC then reclaims inside the process instead of the host swapping. Alternative considered: an in-app memory monitor (over-engineering) or relying on `mem_limit` alone (the kernel kills the process instead of letting GC work). The spec ceiling is 320 MB, so raising the value later stays within contract.
- **Postgres tuning via `command:` flags in compose** (`postgres -c shared_buffers=64MB -c work_mem=4MB -c max_connections=20`). Rationale: keeps `docker-compose.yml` the single source of truth. Alternative considered: mounting a `postgresql.conf` (another artifact to keep in sync).
- **Log rotation via the compose `logging` block** (`driver: json-file`, `options: {max-size: "1m", max-file: "5"}` on both services). Rationale: caps storage at the driver level without touching application code; app output stays structured JSON on stdout. Alternative considered: none - capping in the app is unreliable under crash/restart.
- **Size-aware eviction of `tmdb_cache` in the existing sweep cycle.** On a due sweep, after removing expired rows, compute `sum(octet_length(payload::text))` and, while usage exceeds the budget, delete the oldest rows by `updated_at` until usage drops below a lower hysteresis threshold (~90 MB), avoiding eviction churn at the boundary. Rationale: reuses the existing periodic hook (`sweepExpiredIfDue`) and keeps eviction in the application where it is testable. Alternatives considered: TTL-only cap (no ceiling - rejected), row-count cap (size per row varies 5-50 KB - imprecise), a Postgres-side cron/pg_cron job (extra mechanism, harder to test).
- **Eviction only when over budget.** Rows are never evicted early while under budget, preserving the existing stale-on-error fallback (an expired row can still back a failed TMDB fetch until it is swept). Eviction order is oldest `updated_at` first, so the most recently used payloads survive.
- **Strip npm/yarn from the runner layer** with a `RUN rm -rf` in the `runner` stage, keeping `node:22-alpine` as the base. Rationale: saves the npm payload without changing the libc/toolchain pairing of the standalone build. Alternative considered: a distroless Node base (glibc) - rejected because the standalone output is built on Alpine/musl and a base swap risks native-module mismatch for marginal gain.
- **A supporting `updated_at` index for eviction ordering.** The table already stores `updated_at` (set on upsert); the eviction `ORDER BY updated_at` gets an index so the sweep stays cheap. This is a small new migration (the `expires_at` index alone does not serve the eviction ordering).

## Risks / Trade-offs

- **Heap ceiling too low for a spike** → the process can hit `JS heap out of memory` where it previously survived via swap. Mitigation: 256 MB with the spec allowing up to 320 MB; the value is a single env var to raise if logs show heap exhaustion; keep `--max-old-space-size` observable in the deploy config.
- **Eviction drops stale-on-error fallbacks** → a TMDB hiccup could surface a fetch error where a stale payload used to be served. Mitigation: eviction only runs over budget and oldest-first, so it is rare and touches the least-recently-updated payloads; the regular TTL fallback behavior is otherwise unchanged.
- **`max_connections=20` exhausted** → new connections fail. Mitigation: app pool is 10, plus one `LISTEN` connection, plus short-lived migrator and health-check connections; 20 leaves headroom on this workload. Watch for connection errors after deploy.
- **Log rotation loses older logs** → no long history for post-mortems. Mitigation: accepted, that is the 5 MB budget; the runbook points to `docker stats`/`free -h`/OOM signals for diagnosis.
- **Image-size gain from stripping npm is modest** → the change may not visibly "compress" the image. Mitigation: the image was already multi-stage and standalone; measure `docker images` on the next deploy and treat the runtime-memory caps, not the image, as the fix for the host instability.

## Migration Plan

- Ship through the existing CI/CD pipeline: `docker-compose.yml` and the images are delivered the same way; `scripts/deploy.sh` already re-creates services and prunes dangling images.
- No data migration is required for the cache behavior; the new `updated_at` index migration runs through the existing `migrate` step before `up`.
- Rollback uses the existing `previous` image tag in `scripts/deploy.sh`; the compose changes are compatible with the previous image (its only new inputs are env/command/logging settings).
- Verification on the host: `free -h` and `docker stats` after deploy to confirm RSS stays within budget and swap stays flat.
