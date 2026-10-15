import { beforeEach, describe, expect, it, vi } from 'vitest';

const MB = 1024 * 1024;

type Row = { key: string; size: number; updatedAt: number; expiresAt: Date };

const { store, spies } = vi.hoisted(() => ({
  store: { rows: [] as Row[] },
  spies: { deleteOldest: vi.fn<(maxBytes: number) => void>(), deleteExpired: vi.fn() },
}));

vi.mock('@/modules/catalog/cache-repository', () => ({
  selectCacheEntry: vi.fn(async () => null),
  upsertCacheEntry: vi.fn(async () => undefined),
  deleteExpiredCache: vi.fn(async (now: Date) => {
    let removed = 0;
    for (let i = store.rows.length - 1; i >= 0; i -= 1) {
      if (store.rows[i]!.expiresAt.getTime() < now.getTime()) {
        store.rows.splice(i, 1);
        removed += 1;
      }
    }
    spies.deleteExpired();
    return removed;
  }),
  selectCacheUsageBytes: vi.fn(async () =>
    store.rows.reduce((sum, row) => sum + row.size, 0),
  ),
  deleteOldestCache: vi.fn(async (maxBytes: number) => {
    const ordered = [...store.rows].sort((a, b) => a.updatedAt - b.updatedAt);
    const doomed = new Set<string>();
    let removedBytes = 0;
    for (const row of ordered) {
      if (removedBytes >= maxBytes) break;
      doomed.add(row.key);
      removedBytes += row.size;
    }
    store.rows = store.rows.filter((row) => !doomed.has(row.key));
    spies.deleteOldest(maxBytes);
    return doomed.size;
  }),
}));

import {
  TMDB_CACHE_BUDGET_BYTES,
  TMDB_CACHE_EVICT_TARGET_BYTES,
  sweepCache,
} from '@/modules/catalog/service';

const future = new Date('2999-01-01T00:00:00Z');
const usage = () => store.rows.reduce((sum, row) => sum + row.size, 0);

describe('catalog cache budget sweep', () => {
  beforeEach(() => {
    store.rows = [];
    spies.deleteOldest.mockClear();
    spies.deleteExpired.mockClear();
  });

  it('keeps every entry while usage stays under budget', async () => {
    store.rows = [
      { key: 'old', size: 30 * MB, updatedAt: 1, expiresAt: future },
      { key: 'new', size: 30 * MB, updatedAt: 2, expiresAt: future },
    ];

    await sweepCache(new Date());

    expect(spies.deleteOldest).not.toHaveBeenCalled();
    expect(store.rows.map((row) => row.key)).toEqual(['old', 'new']);
  });

  it('evicts the oldest entries and halts at the hysteresis threshold when over budget', async () => {
    store.rows = [
      { key: 'oldest', size: 60 * MB, updatedAt: 1, expiresAt: future },
      { key: 'middle', size: 60 * MB, updatedAt: 2, expiresAt: future },
      { key: 'newest', size: 60 * MB, updatedAt: 3, expiresAt: future },
    ];

    await sweepCache(new Date());

    expect(spies.deleteOldest).toHaveBeenCalledWith(180 * MB - TMDB_CACHE_EVICT_TARGET_BYTES);
    expect(store.rows.map((row) => row.key)).toEqual(['newest']);
    expect(usage()).toBeLessThanOrEqual(TMDB_CACHE_EVICT_TARGET_BYTES);
  });

  it('still sweeps expired entries when it also evicts for size', async () => {
    store.rows = [
      { key: 'expired', size: 60 * MB, updatedAt: 0, expiresAt: new Date('2000-01-01T00:00:00Z') },
      { key: 'old', size: 60 * MB, updatedAt: 1, expiresAt: future },
      { key: 'new', size: 60 * MB, updatedAt: 2, expiresAt: future },
    ];

    await sweepCache(new Date('2026-01-01T00:00:00Z'));

    expect(spies.deleteExpired).toHaveBeenCalledTimes(1);
    expect(store.rows.map((row) => row.key)).toEqual(['new']);
  });

  it('does not evict at exactly the budget boundary', async () => {
    store.rows = [{ key: 'a', size: TMDB_CACHE_BUDGET_BYTES, updatedAt: 1, expiresAt: future }];

    await sweepCache(new Date());

    expect(spies.deleteOldest).not.toHaveBeenCalled();
    expect(store.rows.map((row) => row.key)).toEqual(['a']);
  });
});
