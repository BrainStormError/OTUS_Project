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
    `INSERT INTO tmdb_cache (cache_key, payload, expires_at)
          VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (cache_key) DO UPDATE
            SET payload = EXCLUDED.payload,
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
