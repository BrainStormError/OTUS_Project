import { afterAll, describe, expect, it } from 'vitest';

import { closePool, query } from '@/core/db/pool';
import { deleteOldestCache, selectCacheUsageBytes } from '@/modules/catalog/cache-repository';

type Row = { id: number; payload_bytes: number; updated_at: Date };

// Reference implementation of the previous windowed-sum eviction, kept here so
// the bounded rewrite can be checked against the behaviour it replaced.
function expectedDoomed(rows: Row[], maxBytes: number): Set<number> {
  const ordered = [...rows].sort(
    (a, b) => a.updated_at.getTime() - b.updated_at.getTime() || a.id - b.id,
  );
  const doomed = new Set<number>();
  let removedBefore = 0;
  for (const row of ordered) {
    if (removedBefore >= maxBytes) break;
    doomed.add(row.id);
    removedBefore += row.payload_bytes;
  }
  return doomed;
}

async function seed(count: number, bytes: number): Promise<Row[]> {
  await query(
    `INSERT INTO tmdb_cache (cache_key, payload, payload_bytes, expires_at, updated_at)
     SELECT 'k' || g,
            '{}'::jsonb,
            $2,
            now() + interval '1 day',
            timestamptz '2020-01-01T00:00:00Z' + (g || ' seconds')::interval
       FROM generate_series(1, $1) AS g`,
    [count, bytes],
  );
  return query<Row>('SELECT id, payload_bytes, updated_at FROM tmdb_cache');
}

async function remainingIds(): Promise<Set<number>> {
  const rows = await query<{ id: number }>('SELECT id FROM tmdb_cache');
  return new Set(rows.map((row) => row.id));
}

afterAll(async () => {
  await closePool();
});

describe('bounded TMDB cache eviction', () => {
  it('removes the same ids as the windowed-sum eviction for a large reclaim', async () => {
    const rows = await seed(600, 100);
    const expected = expectedDoomed(rows, 30_000);
    const usageBefore = await selectCacheUsageBytes();

    const removed = await deleteOldestCache(30_000);

    expect(removed).toBe(expected.size);
    const surviving = await remainingIds();
    for (const id of expected) {
      expect(surviving.has(id)).toBe(false);
    }
    expect(surviving.size).toBe(rows.length - expected.size);

    const removedBytes = rows
      .filter((row) => expected.has(row.id))
      .reduce((sum, row) => sum + row.payload_bytes, 0);
    expect(removedBytes).toBeGreaterThanOrEqual(30_000);
    expect(await selectCacheUsageBytes()).toBe(usageBefore - removedBytes);
  });

  it('removes the same oldest ids for a small excess without scanning the whole cache', async () => {
    const rows = await seed(300, 100);
    const expected = expectedDoomed(rows, 500);

    const removed = await deleteOldestCache(500);

    expect(removed).toBe(expected.size);
    expect(expected.size).toBeGreaterThan(0);
    expect(expected.size).toBeLessThan(rows.length);
    const surviving = await remainingIds();
    expect(surviving).toEqual(
      new Set(rows.map((row) => row.id).filter((id) => !expected.has(id))),
    );
  });

  it('evicts everything when the table cannot cover the target', async () => {
    const rows = await seed(3, 100);

    expect(await deleteOldestCache(10_000)).toBe(rows.length);
    expect(await selectCacheUsageBytes()).toBe(0);
  });
});
