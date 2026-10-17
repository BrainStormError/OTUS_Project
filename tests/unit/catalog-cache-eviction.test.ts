import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = { key: string; size: number; updatedAt: number; expiresAt: Date };

const { store, spies, control } = vi.hoisted(() => ({
  store: { rows: [] as Row[] },
  spies: { deleteOldest: vi.fn<(maxBytes: number) => void>(), deleteExpired: vi.fn() },
  control: { expireGate: null as Promise<void> | null },
}));

vi.mock('@/modules/catalog/cache-repository', () => ({
  selectCacheExpiry: vi.fn(async () => null),
  selectCachePayload: vi.fn(async () => undefined),
  upsertCacheEntry: vi.fn(async () => undefined),
  deleteExpiredCache: vi.fn(async (now: Date) => {
    spies.deleteExpired();
    if (control.expireGate) {
      await control.expireGate;
    }
    let removed = 0;
    for (let i = store.rows.length - 1; i >= 0; i -= 1) {
      if (store.rows[i]!.expiresAt.getTime() < now.getTime()) {
        store.rows.splice(i, 1);
        removed += 1;
      }
    }
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
  CACHE_SWEEP_INTERVAL_MS,
  TMDB_CACHE_BUDGET_BYTES,
  TMDB_CACHE_EVICT_TARGET_BYTES,
  startCacheSweep,
  stopCacheSweep,
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

  const quarterBudget = TMDB_CACHE_BUDGET_BYTES / 4;
  const halfBudget = TMDB_CACHE_BUDGET_BYTES / 2;

  it('keeps every entry while usage stays under budget', async () => {
    store.rows = [
      { key: 'old', size: quarterBudget, updatedAt: 1, expiresAt: future },
      { key: 'new', size: quarterBudget, updatedAt: 2, expiresAt: future },
    ];

    await sweepCache(new Date());

    expect(spies.deleteOldest).not.toHaveBeenCalled();
    expect(store.rows.map((row) => row.key)).toEqual(['old', 'new']);
  });

  it('evicts the oldest entries and halts at the hysteresis threshold when over budget', async () => {
    store.rows = [
      { key: 'oldest', size: halfBudget, updatedAt: 1, expiresAt: future },
      { key: 'middle', size: halfBudget, updatedAt: 2, expiresAt: future },
      { key: 'newest', size: halfBudget, updatedAt: 3, expiresAt: future },
    ];

    await sweepCache(new Date());

    expect(spies.deleteOldest).toHaveBeenCalledWith(
      3 * halfBudget - TMDB_CACHE_EVICT_TARGET_BYTES,
    );
    expect(store.rows.map((row) => row.key)).toEqual(['newest']);
    expect(usage()).toBeLessThanOrEqual(TMDB_CACHE_EVICT_TARGET_BYTES);
  });

  it('still sweeps expired entries when it also evicts for size', async () => {
    store.rows = [
      {
        key: 'expired',
        size: TMDB_CACHE_BUDGET_BYTES,
        updatedAt: 0,
        expiresAt: new Date('2000-01-01T00:00:00Z'),
      },
      { key: 'old', size: TMDB_CACHE_BUDGET_BYTES, updatedAt: 1, expiresAt: future },
      { key: 'new', size: TMDB_CACHE_EVICT_TARGET_BYTES, updatedAt: 2, expiresAt: future },
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

describe('catalog cache sweep timer', () => {
  beforeEach(() => {
    store.rows = [];
    control.expireGate = null;
    spies.deleteOldest.mockClear();
    spies.deleteExpired.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopCacheSweep();
    vi.useRealTimers();
  });

  it('runs maintenance on its own cadence', async () => {
    store.rows = [{ key: 'expired', size: 1, updatedAt: 0, expiresAt: new Date(0) }];

    startCacheSweep();
    expect(spies.deleteExpired).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(CACHE_SWEEP_INTERVAL_MS);

    expect(spies.deleteExpired).toHaveBeenCalledTimes(1);
    expect(store.rows).toEqual([]);
  });

  it('does not start a second pass while the first is still running', async () => {
    store.rows = [{ key: 'expired', size: 1, updatedAt: 0, expiresAt: new Date(0) }];
    let release!: () => void;
    control.expireGate = new Promise<void>((resolve) => {
      release = resolve;
    });

    startCacheSweep();
    await vi.advanceTimersByTimeAsync(CACHE_SWEEP_INTERVAL_MS);
    expect(spies.deleteExpired).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(CACHE_SWEEP_INTERVAL_MS);
    expect(spies.deleteExpired).toHaveBeenCalledTimes(1);

    release();
    control.expireGate = null;
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(CACHE_SWEEP_INTERVAL_MS);
    expect(spies.deleteExpired).toHaveBeenCalledTimes(2);
  });

  it('stopCacheSweep halts the timer', async () => {
    startCacheSweep();
    stopCacheSweep();

    await vi.advanceTimersByTimeAsync(CACHE_SWEEP_INTERVAL_MS * 2);

    expect(spies.deleteExpired).not.toHaveBeenCalled();
  });
});
