import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TtlCache,
  catalogSearchQuery,
  resolveDetail,
  resolveSaveMetadata,
  searchCatalog,
  selectKnownGenreIds,
} from '@/modules/catalog';

const { cacheStore } = vi.hoisted(() => ({
  cacheStore: new Map<string, { payload: unknown; expiresAt: Date }>(),
}));

vi.mock('@/modules/catalog/cache-repository', () => ({
  selectCacheExpiry: vi.fn(async (key: string) => cacheStore.get(key)?.expiresAt ?? null),
  selectCachePayload: vi.fn(async (key: string) => cacheStore.get(key)?.payload),
  upsertCacheEntry: vi.fn(async (key: string, payload: unknown, expiresAt: Date) => {
    cacheStore.set(key, { payload, expiresAt });
  }),
  deleteExpiredCache: vi.fn(async (now: Date) => {
    let removed = 0;
    for (const [key, entry] of cacheStore) {
      if (entry.expiresAt.getTime() < now.getTime()) {
        cacheStore.delete(key);
        removed += 1;
      }
    }
    return removed;
  }),
  selectCacheUsageBytes: vi.fn(async () => 0),
  deleteOldestCache: vi.fn(async () => 0),
}));

vi.mock('@/modules/catalog/repository', () => ({
  listGenres: vi.fn(async () => [
    { id: 28, name: 'Боевик' },
    { id: 878, name: 'Фантастика' },
    { id: 18, name: 'Драма' },
  ]),
  listKnownGenreIds: vi.fn(async () => [18, 878]),
  listRatedTitles: vi.fn(async () => []),
}));

import { listKnownGenreIds, listRatedTitles } from '@/modules/catalog/repository';

type Routes = Record<string, unknown>;

function installFetch(routes: Routes, statuses: Record<string, number> = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const [needle, body] of Object.entries(routes)) {
      if (url.includes(needle)) {
        const status = statuses[needle] ?? 200;
        if (status !== 200) {
          return new Response('error', { status });
        }
        return new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const MOVIE_SEARCH = {
  results: [
    {
      id: 27205,
      title: 'Начало',
      release_date: '2010-07-16',
      poster_path: '/poster.jpg',
      vote_average: 8.4,
      genre_ids: [28, 878],
    },
  ],
};

const TV_SEARCH = {
  results: [
    {
      id: 1396,
      name: 'Во все тяжкие',
      first_air_date: '2008-01-20',
      poster_path: null,
      vote_average: 8.9,
      genre_ids: [18],
    },
  ],
};

describe('catalog search', () => {
  beforeEach(() => {
    cacheStore.clear();
    vi.mocked(listKnownGenreIds).mockClear();
    vi.mocked(listRatedTitles).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a film search to the stable result shape', async () => {
    installFetch({ '/search/movie': MOVIE_SEARCH });
    const result = await searchCatalog({ kind: 'film', title: 'Начало' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(1);
    expect(result.value.items[0]).toEqual({
      kind: 'film',
      externalId: '27205',
      title: 'Начало',
      year: 2010,
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      externalRating: 8.4,
      genres: ['Боевик', 'Фантастика'],
      genreIds: [28, 878],
    });
  });

  it('maps a series search to the stable result shape', async () => {
    installFetch({ '/search/tv': TV_SEARCH });
    const result = await searchCatalog({ kind: 'series', title: 'Во все тяжкие' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items[0]).toMatchObject({
      kind: 'series',
      externalId: '1396',
      title: 'Во все тяжкие',
      year: 2008,
      posterUrl: null,
      genres: ['Драма'],
    });
  });

  it('does not persist search results', async () => {
    installFetch({ '/search/movie': MOVIE_SEARCH });
    await searchCatalog({ kind: 'film', title: 'Начало' });
    expect(listRatedTitles).not.toHaveBeenCalled();
  });

  it('narrows discovered results by genre and year range in code', async () => {
    installFetch({
      '/discover/movie': {
        results: [
          { id: 1, title: 'A', release_date: '1999-01-01', genre_ids: [28] },
          { id: 2, title: 'B', release_date: '2001-01-01', genre_ids: [28] },
        ],
      },
    });
    const result = await searchCatalog({
      kind: 'film',
      yearFrom: 1999,
      yearTo: 1999,
      genreIds: [28],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items.map((item) => item.externalId)).toEqual(['1']);
  });

  it('joins multiple genres with | so any selected genre matches', async () => {
    const fetchMock = installFetch({
      '/discover/movie': {
        results: [{ id: 1, title: 'A', release_date: '2000-01-01', genre_ids: [28, 878] }],
      },
    });
    await searchCatalog({ kind: 'film', genreIds: [28, 878] });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('with_genres=28%7C878');
  });

  it('maps a film year range to the discover date params', async () => {
    const fetchMock = installFetch({ '/discover/movie': { results: [] } });
    await searchCatalog({ kind: 'film', yearFrom: 1990, yearTo: 1999 });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('primary_release_date.gte=1990-01-01');
    expect(url).toContain('primary_release_date.lte=1999-12-31');
  });

  it('maps a series year range to the first-air date params', async () => {
    const fetchMock = installFetch({ '/discover/tv': { results: [] } });
    await searchCatalog({ kind: 'series', yearFrom: 2001, yearTo: 2005 });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('first_air_date.gte=2001-01-01');
    expect(url).toContain('first_air_date.lte=2005-12-31');
  });

  it('filters the title path by the year range in memory', async () => {
    installFetch({
      '/search/movie': {
        results: [
          { id: 1, title: 'A', release_date: '1990-05-01' },
          { id: 2, title: 'B', release_date: '2005-05-01' },
        ],
      },
    });
    const result = await searchCatalog({ kind: 'film', title: 'q', yearFrom: 2000, yearTo: 2010 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items.map((item) => item.externalId)).toEqual(['2']);
  });

  it('resolves genre names from the stored catalog and falls back to the id', async () => {
    installFetch({
      '/discover/movie': {
        results: [{ id: 1, title: 'A', release_date: '2000-01-01', genre_ids: [28, 999999] }],
      },
    });
    const result = await searchCatalog({ kind: 'film', genreIds: [28] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items[0]!.genres).toEqual(['Боевик', '999999']);
  });

  it('returns an error result when TMDB fails', async () => {
    installFetch({ '/search/movie': {} }, { '/search/movie': 500 });
    const result = await searchCatalog({ kind: 'film', title: 'Начало' });
    expect(result.ok).toBe(false);
  });
});

describe('catalog search paging', () => {
  beforeEach(() => {
    cacheStore.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the first page and reports that more pages exist', async () => {
    const fetchMock = installFetch({
      '/discover/movie': {
        results: [{ id: 1, title: 'A', release_date: '2000-01-01' }],
        page: 1,
        total_pages: 3,
      },
    });
    const result = await searchCatalog({ kind: 'film' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.page).toBe(1);
    expect(result.value.hasMore).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('page=1');
  });

  it('requests a following page for the same criteria', async () => {
    const fetchMock = installFetch({
      '/discover/movie': {
        results: [{ id: 2, title: 'B', release_date: '2000-01-01' }],
        page: 2,
        total_pages: 3,
      },
    });
    const result = await searchCatalog({ kind: 'film', page: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.page).toBe(2);
    expect(result.value.hasMore).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('page=2');
  });

  it('reports no further pages on the last page', async () => {
    installFetch({
      '/discover/movie': { results: [], page: 3, total_pages: 3 },
    });
    const result = await searchCatalog({ kind: 'film', page: 3 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasMore).toBe(false);
  });
});

describe('catalog search schema', () => {
  it('accepts a year range with both bounds', () => {
    const parsed = catalogSearchQuery.safeParse({ kind: 'film', yearFrom: '1990', yearTo: '2000' });
    expect(parsed.success).toBe(true);
  });

  it('accepts an open-ended year range', () => {
    const parsed = catalogSearchQuery.safeParse({ kind: 'series', yearFrom: '2000' });
    expect(parsed.success).toBe(true);
  });

  it('rejects a lower bound above the upper bound', () => {
    const parsed = catalogSearchQuery.safeParse({ kind: 'film', yearFrom: '2010', yearTo: '2000' });
    expect(parsed.success).toBe(false);
  });
});

describe('catalog detail', () => {
  beforeEach(() => {
    cacheStore.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves a film detail with its director', async () => {
    installFetch({
      '/movie/27205': {
        id: 27205,
        title: 'Начало',
        release_date: '2010-07-16',
        genres: [{ id: 878, name: 'Фантастика' }],
        credits: { crew: [{ job: 'Director', name: 'Кристофер Нолан' }] },
      },
    });
    const result = await resolveDetail('film', '27205');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.director).toBe('Кристофер Нолан');
    expect(result.value.genres).toEqual(['Фантастика']);
  });

  it('resolves a series detail with its creators', async () => {
    installFetch({
      '/tv/1396': {
        id: 1396,
        name: 'Во все тяжкие',
        first_air_date: '2008-01-20',
        genres: [{ id: 18, name: 'Драма' }],
        created_by: [{ name: 'Винс Гиллиган' }],
      },
    });
    const result = await resolveDetail('series', '1396');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.director).toBe('Винс Гиллиган');
  });

  it('returns a not-found result for an unknown id', async () => {
    installFetch({ '/movie/999999999': {} }, { '/movie/999999999': 404 });
    const result = await resolveDetail('film', '999999999');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });
});

describe('catalog save metadata', () => {
  beforeEach(() => {
    cacheStore.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps known genre ids and drops unknown ones', async () => {
    installFetch({
      '/movie/27205': {
        id: 27205,
        title: 'Начало',
        release_date: '2010-07-16',
        genres: [
          { id: 18, name: 'Драма' },
          { id: 999999, name: 'Несуществующий' },
        ],
        credits: { crew: [{ job: 'Director', name: 'Кристофер Нолан' }] },
      },
    });
    const result = await resolveSaveMetadata('film', '27205');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.genreIds).toEqual([18]);
    expect(result.value.director).toBe('Кристофер Нолан');
  });

  it('maps known ids and drops unknown ids in the pure helper', () => {
    expect(selectKnownGenreIds([18, 999999, 878, 18], [18, 878])).toEqual([18, 878]);
  });
});

describe('catalog cache', () => {
  beforeEach(() => {
    cacheStore.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('avoids a second fetch for an identical search', async () => {
    const fetchMock = installFetch({
      '/search/movie': MOVIE_SEARCH,
    });
    await searchCatalog({ kind: 'film', title: 'Начало' });
    await searchCatalog({ kind: 'film', title: 'Начало' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches a range search separately from an unfiltered one', async () => {
    const fetchMock = installFetch({ '/discover/movie': { results: [] } });
    await searchCatalog({ kind: 'film' });
    await searchCatalog({ kind: 'film', yearFrom: 2000, yearTo: 2010 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('caches a page separately from the first page', async () => {
    const fetchMock = installFetch({ '/discover/movie': { results: [] } });
    await searchCatalog({ kind: 'film' });
    await searchCatalog({ kind: 'film', page: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('expires entries after the ttl', () => {
    let now = 0;
    const cache = new TtlCache<number>(1000, () => now);
    cache.set('key', 1);
    expect(cache.get('key')).toBe(1);
    now = 1001;
    expect(cache.get('key')).toBeUndefined();
  });
});
