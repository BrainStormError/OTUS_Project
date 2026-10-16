import { query } from '@/core/db/pool';

export type CacheEntry = {
  payload: unknown;
  expiresAt: Date;
};

type CacheRow = {
  payload: unknown;
  expires_at: Date;
};

export async function selectCacheEntry(
  cacheKey: string,
): Promise<CacheEntry | null> {
  const rows = await query<CacheRow>(
    'SELECT payload, expires_at FROM tmdb_cache WHERE cache_key = $1',
    [cacheKey],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return { payload: row.payload, expiresAt: row.expires_at };
}

export async function upsertCacheEntry(
  cacheKey: string,
  payload: unknown,
  expiresAt: Date,
): Promise<void> {
  await query(
    `INSERT INTO tmdb_cache (cache_key, payload, payload_bytes, expires_at)
          VALUES ($1, $2::jsonb, octet_length($2::jsonb::text), $3)
     ON CONFLICT (cache_key) DO UPDATE
            SET payload = EXCLUDED.payload,
                payload_bytes = EXCLUDED.payload_bytes,
                expires_at = EXCLUDED.expires_at,
                updated_at = now()`,
    [cacheKey, JSON.stringify(payload), expiresAt],
  );
}

export async function deleteExpiredCache(now: Date): Promise<number> {
  const rows = await query<{ id: number }>(
    'DELETE FROM tmdb_cache WHERE expires_at < $1 RETURNING id',
    [now],
  );
  return rows.length;
}

export async function selectCacheUsageBytes(): Promise<number> {
  const rows = await query<{ usage: number }>(
    'SELECT COALESCE(SUM(payload_bytes), 0)::bigint AS usage FROM tmdb_cache',
  );
  return Number(rows[0]?.usage ?? 0);
}

// Deletes the oldest rows (by updated_at, then id) until the payload bytes
// removed reach maxBytes, so the caller's usage target is guaranteed met. The
// running total excludes the current row, so the row that crosses the threshold
// is removed too.
export async function deleteOldestCache(maxBytes: number): Promise<number> {
  if (maxBytes <= 0) {
    return 0;
  }
  const rows = await query<{ id: number }>(
    `DELETE FROM tmdb_cache
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 SUM(payload_bytes)
                   OVER (ORDER BY updated_at ASC, id ASC)
                   - payload_bytes AS removed_before
            FROM tmdb_cache
        ) ordered
        WHERE removed_before < $1
      )
      RETURNING id`,
    [maxBytes],
  );
  return rows.length;
}
