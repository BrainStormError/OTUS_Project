import { query } from '@/core/db/pool';

// A rate limiter that may be shared by every request path. `consume` is async so
// implementations can use a shared store (Postgres) without blocking the event
// loop, and so the in-memory implementation stays interchangeable in tests.
export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
}

const DEFAULT_MAX_KEYS = 10_000;
const SWEEP_INTERVAL = 128;
const CLEANUP_INTERVAL = 200;
const STALE_AFTER_MS = 60 * 60 * 1000;

// Process-local limiter with a hard bound on the number of tracked keys. Idle
// keys (no hit within the window) are evicted periodically and whenever the
// bound is exceeded; if the map is still over the bound, the oldest keys are
// dropped, so a burst of distinct keys cannot grow memory without limit.
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private callsSinceSweep = 0;

  constructor(
    private readonly now: () => number = () => Date.now(),
    private readonly maxKeys: number = DEFAULT_MAX_KEYS,
  ) {}

  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    const current = this.now();
    const recent = (this.hits.get(key) ?? []).filter((at) => current - at < windowMs);
    this.hits.delete(key);

    let allowed: boolean;
    if (recent.length >= limit) {
      allowed = false;
    } else {
      recent.push(current);
      allowed = true;
    }
    this.hits.set(key, recent);

    this.callsSinceSweep += 1;
    if (this.callsSinceSweep >= SWEEP_INTERVAL || this.hits.size > this.maxKeys) {
      this.callsSinceSweep = 0;
      this.evict(current, windowMs);
    }
    return allowed;
  }

  size(): number {
    return this.hits.size;
  }

  reset(): void {
    this.hits.clear();
  }

  private evict(current: number, windowMs: number): void {
    for (const [key, times] of this.hits) {
      const last = times[times.length - 1] ?? 0;
      if (current - last >= windowMs) {
        this.hits.delete(key);
      }
    }
    while (this.hits.size > this.maxKeys) {
      const oldest = this.hits.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.hits.delete(oldest);
    }
  }
}

// Shared, fixed-window counter backed by the existing Postgres pool. The upsert
// is a single statement, so concurrent requests across pooled connections are
// counted against the same limit. Idle rows are cleaned up periodically.
export class PostgresRateLimiter implements RateLimiter {
  private callsSinceCleanup = 0;

  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    const rows = await query<{ count: number }>(
      `INSERT INTO rate_limit_counters (key, window_start, count)
       VALUES ($1, now(), 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE
           WHEN rate_limit_counters.window_start <= now() - ($2::bigint * interval '1 millisecond')
             THEN 1
           ELSE rate_limit_counters.count + 1
         END,
         window_start = CASE
           WHEN rate_limit_counters.window_start <= now() - ($2::bigint * interval '1 millisecond')
             THEN now()
           ELSE rate_limit_counters.window_start
         END
       RETURNING count`,
      [key, windowMs],
    );

    this.callsSinceCleanup += 1;
    if (this.callsSinceCleanup >= CLEANUP_INTERVAL) {
      this.callsSinceCleanup = 0;
      await query(`DELETE FROM rate_limit_counters WHERE window_start < now() - $1::bigint * interval '1 millisecond'`, [
        STALE_AFTER_MS,
      ]).catch(() => undefined);
    }

    return Number(rows[0]?.count ?? 0) <= limit;
  }

  async reset(): Promise<void> {
    await query(`DELETE FROM rate_limit_counters`);
  }
}

let sharedLimiter: RateLimiter | null = null;

export function getSharedRateLimiter(): RateLimiter {
  if (sharedLimiter === null) {
    sharedLimiter = new PostgresRateLimiter();
  }
  return sharedLimiter;
}
