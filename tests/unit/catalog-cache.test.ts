import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cacheStore, upsertMock } = vi.hoisted(() => ({
  cacheStore: new Map<string, { payload: unknown; expiresAt: Date }>(),
  upsertMock: vi.fn(async (key: string, payload: unknown, expiresAt: Date) => {
    cacheStore.set(key, { payload, expiresAt });
  }),
}));

vi.mock('@/modules/catalog/cache-repository', () => ({
  selectCacheEntry: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
  upsertCacheEntry: upsertMock,
  deleteExpiredCache: vi.fn(async () => 0),
}));

vi.mock('@/modules/catalog/repository', () => ({
  listGenres: vi.fn(async () => []),
  listKnownGenreIds: vi.fn(async () => []),
  listRatedTitles: vi.fn(async () => []),
}));

import { detailCacheKey, searchCacheKey } from '@/modules/catalog/cache-key';
import { resolveDetail, searchCatalog } from '@/modules/catalog';

const RAW_SEARCH = {
  items: [{ id: 27205, title: 'Начало', release_date: '2010-07-16', genre_ids: [878] }],
  page: 1,
  totalPages: 1,
};

function installFetch(status = 200) {
  const fetchMock = vi.fn(async () => {
    if (status !== 200) {
      return new Response('error', { status });
    }
    return new Response(JSON.stringify({ results: RAW_SEARCH.items }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('catalog read-through cache', () => {
  beforeEach(() => {
    cacheStore.clear();
    upsertMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serves a fresh hit from the store without calling TMDB', async () => {
    const fetchMock = installFetch();
    const key = searchCacheKey('film', {});
    cacheStore.set(key, {
      payload: RAW_SEARCH,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await searchCatalog({ kind: 'film' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items[0]?.externalId).toBe('27205');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches on a miss and writes the raw payload back to the store', async () => {
    const fetchMock = installFetch();
    const result = await searchCatalog({ kind: 'film' });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const [key, payload] = upsertMock.mock.calls[0] as [string, unknown, Date];
    expect(key).toBe(searchCacheKey('film', {}));
    expect(payload).toMatchObject({ items: RAW_SEARCH.items, page: 1, totalPages: 1 });
  });

  it('refetches when the stored row is expired', async () => {
    const fetchMock = installFetch();
    cacheStore.set(searchCacheKey('film', {}), {
      payload: { items: [], page: 1, totalPages: 1 },
      expiresAt: new Date(Date.now() - 1),
    });

    const result = await searchCatalog({ kind: 'film' });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(cacheStore.get(searchCacheKey('film', {}))?.expiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('falls back to the last known value when TMDB fails and a stale row exists', async () => {
    installFetch(500);
    cacheStore.set(searchCacheKey('film', {}), {
      payload: RAW_SEARCH,
      expiresAt: new Date(Date.now() - 1),
    });

    const result = await searchCatalog({ kind: 'film' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items[0]?.externalId).toBe('27205');
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('returns an error when TMDB fails and no row is stored', async () => {
    installFetch(500);
    const result = await searchCatalog({ kind: 'film' });
    expect(result.ok).toBe(false);
  });

  it('falls back to the last known detail when TMDB fails', async () => {
    installFetch(500);
    cacheStore.set(detailCacheKey('film', '27205'), {
      payload: { id: 27205, title: 'Начало', release_date: '2010-07-16', genres: [] },
      expiresAt: new Date(Date.now() - 1),
    });

    const result = await resolveDetail('film', '27205');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe('Начало');
  });
});
