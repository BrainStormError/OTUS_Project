import { query } from '@/core/db/pool';

// Freshness is a single-column read so an expired entry never transfers its
// stored payload over the wire.
export async function selectCacheExpiry(cacheKey: string): Promise<Date | null> {
  const rows = await query<{ expires_at: Date }>(
    'SELECT expires_at FROM tmdb_cache WHERE cache_key = $1',
    [cacheKey],
  );
  return rows[0]?.expires_at ?? null;
}

// Read separately from the expiry check: only a caller about to serve the
// entry pays for lifting the payload.
export async function selectCachePayload(cacheKey: string): Promise<unknown> {
  const rows = await query<{ payload: unknown }>(
    'SELECT payload FROM tmdb_cache WHERE cache_key = $1',
    [cacheKey],
  );
  return rows[0]?.payload;
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

// Rows are scanned oldest-first (updated_at, id) in bounded batches, stopping
// as soon as the accumulated payload bytes reach maxBytes; only the rows that
// were actually inspected are deleted. Work therefore scales with the reclaim
// target rather than with the size of the cache. The row that crosses the
// threshold is removed too, matching the previous windowed-sum behaviour.
const EVICT_SCAN_BATCH = 256;

type EvictRow = { id: number; payload_bytes: number; updated_at: Date };

export async function deleteOldestCache(maxBytes: number): Promise<number> {
  if (maxBytes <= 0) {
    return 0;
  }
  const doomed: number[] = [];
  let removedBytes = 0;
  let cursor: { updatedAt: Date; id: number } | null = null;

  while (removedBytes < maxBytes) {
    const rows: EvictRow[] = cursor
      ? await query<EvictRow>(
          `SELECT id, payload_bytes, updated_at FROM tmdb_cache
            WHERE (updated_at, id) > ($1, $2)
            ORDER BY updated_at ASC, id ASC
            LIMIT $3`,
          [cursor.updatedAt, cursor.id, EVICT_SCAN_BATCH],
        )
      : await query<EvictRow>(
          `SELECT id, payload_bytes, updated_at FROM tmdb_cache
            ORDER BY updated_at ASC, id ASC
            LIMIT $1`,
          [EVICT_SCAN_BATCH],
        );

    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      if (removedBytes >= maxBytes) {
        break;
      }
      doomed.push(row.id);
      removedBytes += row.payload_bytes;
      cursor = { updatedAt: row.updated_at, id: row.id };
    }
    if (rows.length < EVICT_SCAN_BATCH || removedBytes >= maxBytes) {
      break;
    }
  }

  if (doomed.length === 0) {
    return 0;
  }
  const deleted = await query<{ id: number }>(
    'DELETE FROM tmdb_cache WHERE id = ANY($1::bigint[]) RETURNING id',
    [doomed],
  );
  return deleted.length;
}
