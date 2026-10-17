import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/core/db/pool', () => ({ query: queryMock }));

import {
  deleteExpiredCache,
  deleteOldestCache,
  selectCacheExpiry,
  selectCachePayload,
  selectCacheUsageBytes,
  upsertCacheEntry,
} from '@/modules/catalog/cache-repository';

function evictRow(id: number, payloadBytes: number, second = 0) {
  return { id, payload_bytes: payloadBytes, updated_at: new Date(Date.UTC(2020, 0, 1, 0, 0, second)) };
}

describe('catalog cache repository', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([]);
  });

  it('upserts on the cache_key conflict so rewrites stay idempotent', async () => {
    const expiresAt = new Date('2020-01-01T00:00:00Z');
    await upsertCacheEntry('search:film|lang=ru-RU', { results: [] }, expiresAt);

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/INSERT INTO tmdb_cache/);
    expect(sql).toMatch(/ON CONFLICT \(cache_key\) DO UPDATE/);
    expect(sql).toContain('$2::jsonb');
    expect(sql).toMatch(/payload_bytes/);
    expect(sql).toContain('octet_length($2::jsonb::text)');
    expect(params).toEqual([
      'search:film|lang=ru-RU',
      JSON.stringify({ results: [] }),
      expiresAt,
    ]);
  });

  it('reads only the expiry to decide freshness', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');
    queryMock.mockResolvedValueOnce([{ expires_at: expiresAt }]);

    expect(await selectCacheExpiry('detail:film:1|lang=ru-RU')).toEqual(expiresAt);

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/SELECT expires_at FROM tmdb_cache/);
    expect(sql).not.toMatch(/payload/);
    expect(params).toEqual(['detail:film:1|lang=ru-RU']);
  });

  it('returns null expiry when no row matches the key', async () => {
    queryMock.mockResolvedValueOnce([]);
    expect(await selectCacheExpiry('missing')).toBeNull();
  });

  it('lifts the payload on a separate read', async () => {
    queryMock.mockResolvedValueOnce([{ payload: { id: 1 } }]);

    expect(await selectCachePayload('detail:film:1|lang=ru-RU')).toEqual({ id: 1 });

    const [sql] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/SELECT payload FROM tmdb_cache/);
    expect(sql).not.toMatch(/expires_at/);
  });

  it('deletes expired rows and reports the count', async () => {
    const now = new Date('2020-01-01T00:00:00Z');
    queryMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const removed = await deleteExpiredCache(now);
    expect(removed).toBe(2);

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/DELETE FROM tmdb_cache WHERE expires_at < \$1/);
    expect(params).toEqual([now]);
  });

  it('reports cache usage as the summed payload size', async () => {
    queryMock.mockResolvedValueOnce([{ usage: 4096 }]);

    expect(await selectCacheUsageBytes()).toBe(4096);

    const [sql] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('SUM(payload_bytes)');
    expect(sql).toMatch(/FROM tmdb_cache/);
  });

  it('reports zero usage when the table is empty', async () => {
    queryMock.mockResolvedValueOnce([]);
    expect(await selectCacheUsageBytes()).toBe(0);
  });

  it('inspects only enough oldest rows to reclaim a small excess', async () => {
    const batch = Array.from({ length: 10 }, (_, i) => evictRow(i + 1, 10, i));
    queryMock.mockResolvedValueOnce(batch);
    queryMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);

    expect(await deleteOldestCache(30)).toBe(3);

    expect(queryMock).toHaveBeenCalledTimes(2);
    const [selectSql, selectParams] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(selectSql).toMatch(/ORDER BY updated_at ASC, id ASC/);
    expect(selectSql).toMatch(/LIMIT/);
    expect(selectSql).not.toMatch(/SUM\(payload_bytes\)/);
    expect(selectParams).toEqual([256]);

    const [deleteSql, deleteParams] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(deleteSql).toMatch(/DELETE FROM tmdb_cache WHERE id = ANY\(\$1::bigint\[\]\)/);
    expect(deleteParams).toEqual([[1, 2, 3]]);
  });

  it('continues with a keyset scan only while the target is unmet', async () => {
    const fullBatch = Array.from({ length: 256 }, (_, i) => evictRow(i + 1, 1, i));
    const tailBatch = Array.from({ length: 100 }, (_, i) => evictRow(257 + i, 1, i));
    queryMock.mockResolvedValueOnce(fullBatch);
    queryMock.mockResolvedValueOnce(tailBatch);
    queryMock.mockResolvedValueOnce([{ id: 300 }]);

    await deleteOldestCache(300);

    expect(queryMock).toHaveBeenCalledTimes(3);
    const [secondSql, secondParams] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(secondSql).toMatch(/WHERE \(updated_at, id\) > \(\$1, \$2\)/);
    expect(secondParams).toEqual([fullBatch[255]!.updated_at, 256, 256]);
  });

  it('keeps a scan from deleting rows when the table is exhausted under target', async () => {
    queryMock.mockResolvedValueOnce([evictRow(1, 10), evictRow(2, 10)]);
    queryMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    expect(await deleteOldestCache(10_000)).toBe(2);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it('deletes nothing when the table is empty', async () => {
    queryMock.mockResolvedValueOnce([]);

    expect(await deleteOldestCache(1024)).toBe(0);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('skips eviction when there is nothing to remove', async () => {
    expect(await deleteOldestCache(0)).toBe(0);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
