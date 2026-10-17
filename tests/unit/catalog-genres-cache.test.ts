import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listGenresMock } = vi.hoisted(() => ({ listGenresMock: vi.fn() }));

vi.mock('@/modules/catalog/repository', () => ({
  listGenres: listGenresMock,
  listKnownGenreIds: vi.fn(async () => []),
  listRatedTitles: vi.fn(async () => []),
}));

vi.mock('@/modules/catalog/cache-repository', () => ({
  selectCacheExpiry: vi.fn(async () => null),
  selectCachePayload: vi.fn(async () => undefined),
  upsertCacheEntry: vi.fn(async () => undefined),
  deleteExpiredCache: vi.fn(async () => 0),
  selectCacheUsageBytes: vi.fn(async () => 0),
  deleteOldestCache: vi.fn(async () => 0),
}));

import { listGenres } from '@/modules/catalog/service';

beforeEach(() => {
  listGenresMock.mockReset();
});

describe('genre catalog cache', () => {
  it('serves repeated reads within the TTL from the in-process cache', async () => {
    listGenresMock.mockResolvedValue([{ id: 18, name: 'Драма' }]);

    const first = await listGenres();
    const second = await listGenres();

    expect(listGenresMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(second.ok && second.value).toEqual([{ id: 18, name: 'Драма' }]);
  });

  it('caches each media kind separately', async () => {
    listGenresMock.mockImplementation(async (kind?: string) =>
      kind === 'series'
        ? [{ id: 10765, name: 'Научная фантастика и фэнтези' }]
        : [{ id: 14, name: 'Фэнтези' }],
    );

    await listGenres('film');
    await listGenres('film');
    const series = await listGenres('series');

    expect(listGenresMock).toHaveBeenCalledTimes(2);
    expect(series.ok && series.value).toEqual([
      { id: 10765, name: 'Научная фантастика и фэнтези' },
    ]);
  });
});
