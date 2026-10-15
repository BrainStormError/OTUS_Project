import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/core/db/pool', () => ({ query: queryMock }));

import {
  deleteExpiredCache,
  deleteOldestCache,
  selectCacheEntry,
  selectCacheUsageBytes,
  upsertCacheEntry,
} from '@/modules/catalog/cache-repository';

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
    expect(params).toEqual([
      'search:film|lang=ru-RU',
      JSON.stringify({ results: [] }),
      expiresAt,
    ]);
  });

  it('returns the stored payload and expiry', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');
    queryMock.mockResolvedValueOnce([{ payload: { id: 1 }, expires_at: expiresAt }]);

    const entry = await selectCacheEntry('detail:film:1|lang=ru-RU');
    expect(entry).toEqual({ payload: { id: 1 }, expiresAt });
  });

  it('returns null when no row matches the key', async () => {
    queryMock.mockResolvedValueOnce([]);
    expect(await selectCacheEntry('missing')).toBeNull();
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
    expect(sql).toContain('SUM(octet_length(payload::text))');
    expect(sql).toMatch(/FROM tmdb_cache/);
  });

  it('reports zero usage when the table is empty', async () => {
    queryMock.mockResolvedValueOnce([]);
    expect(await selectCacheUsageBytes()).toBe(0);
  });

  it('evicts the oldest rows first until the byte budget is covered', async () => {
    queryMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const removed = await deleteOldestCache(1024);
    expect(removed).toBe(2);

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/DELETE FROM tmdb_cache/);
    expect(sql).toMatch(/ORDER BY updated_at ASC, id ASC/);
    expect(sql).toMatch(/RETURNING id/);
    expect(params).toEqual([1024]);
  });

  it('skips eviction when there is nothing to remove', async () => {
    expect(await deleteOldestCache(0)).toBe(0);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
