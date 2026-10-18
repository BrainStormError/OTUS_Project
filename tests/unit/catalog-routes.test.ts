import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { getActorMock, searchMock, detailMock, genresMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  searchMock: vi.fn(),
  detailMock: vi.fn(),
  genresMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/catalog', async () => {
  const schema = await vi.importActual<typeof import('@/modules/catalog/schema')>(
    '@/modules/catalog/schema',
  );
  return {
    searchCatalog: searchMock,
    resolveDetail: detailMock,
    listGenres: genresMock,
    catalogSearchQuery: schema.catalogSearchQuery,
    catalogDetailQuery: schema.catalogDetailQuery,
    catalogGenresQuery: schema.catalogGenresQuery,
  };
});

import { GET as detailRoute } from '@/app/api/catalog/detail/route';
import { GET as genresRoute } from '@/app/api/genres/route';
import { GET as searchRoute } from '@/app/api/search/route';

const actor = { id: 1, role: 'employee' as const };
const origin = { origin: 'http://localhost:3000' };

describe('GET /api/search', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await searchRoute(
      new Request('http://localhost/api/search?kind=film', { headers: origin }),
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await searchRoute(
      new Request('http://localhost/api/search?kind=documentary', { headers: origin }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 for an inverted year range', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await searchRoute(
      new Request('http://localhost/api/search?kind=film&yearFrom=2010&yearTo=2000', {
        headers: origin,
      }),
    );
    expect(response.status).toBe(400);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('returns a page for a valid query', async () => {
    getActorMock.mockResolvedValue(actor);
    const items = [
      {
        kind: 'film',
        externalId: '27205',
        title: 'Начало',
        year: 2010,
        posterUrl: null,
        externalRating: 8.4,
        genres: ['Фантастика'],
        genreIds: [878],
      },
    ];
    searchMock.mockResolvedValue(ok({ items, page: 2, hasMore: true }));

    const response = await searchRoute(
      new Request(
        'http://localhost/api/search?kind=film&q=Начало&genre=878&yearFrom=2000&yearTo=2010&page=2',
        { headers: origin },
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items, page: 2, hasMore: true });
    expect(searchMock).toHaveBeenCalledWith({
      kind: 'film',
      title: 'Начало',
      genreIds: [878],
      yearFrom: 2000,
      yearTo: 2010,
      page: 2,
    });
  });

  it('caches a successful search response in the browser for up to an hour', async () => {
    getActorMock.mockResolvedValue(actor);
    searchMock.mockResolvedValue(ok({ items: [], page: 1, hasMore: false }));

    const response = await searchRoute(
      new Request('http://localhost/api/search?kind=film', { headers: origin }),
    );
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('cache-control') ?? '';
    expect(cacheControl).toBe('private, max-age=3600');
    expect(cacheControl).not.toContain('public');
    expect(cacheControl).not.toContain('s-maxage');
  });
});

describe('GET /api/genres', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await genresRoute(
      new Request('http://localhost/api/genres', { headers: origin }),
    );
    expect(response.status).toBe(401);
  });

  it('rejects a request without a kind', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await genresRoute(
      new Request('http://localhost/api/genres', { headers: origin }),
    );
    expect(response.status).toBe(400);
    expect(genresMock).not.toHaveBeenCalled();
  });

  it('marks the genre response cacheable for the client only', async () => {
    getActorMock.mockResolvedValue(actor);
    genresMock.mockResolvedValue(ok([{ id: 18, name: 'Драма' }]));

    const response = await genresRoute(
      new Request('http://localhost/api/genres?kind=film', { headers: origin }),
    );
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('cache-control') ?? '';
    expect(cacheControl).toContain('private');
    const maxAge = Number(/max-age=(\d+)/.exec(cacheControl)?.[1]);
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(3600);
  });

  it('scopes the list to a kind so a film-only id is excluded', async () => {
    getActorMock.mockResolvedValue(actor);
    genresMock.mockImplementation(async (kind?: 'film' | 'series') =>
      kind === 'series'
        ? ok([{ id: 10765, name: 'Научная фантастика и фэнтези' }])
        : ok([
            { id: 14, name: 'Фэнтези' },
            { id: 10765, name: 'Научная фантастика и фэнтези' },
          ]),
    );

    const response = await genresRoute(
      new Request('http://localhost/api/genres?kind=series', { headers: origin }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: { id: number; name: string }[] };
    expect(body.items).toEqual([{ id: 10765, name: 'Научная фантастика и фэнтези' }]);
    expect(body.items.some((genre) => genre.id === 14)).toBe(false);
    expect(genresMock).toHaveBeenCalledWith('series');
  });
});

describe('GET /api/catalog/detail', () => {
  it('returns a detail for a known id', async () => {
    getActorMock.mockResolvedValue(actor);
    const item = { kind: 'film', externalId: '27205', title: 'Начало' };
    detailMock.mockResolvedValue(ok(item));

    const response = await detailRoute(
      new Request('http://localhost/api/catalog/detail?kind=film&id=27205', { headers: origin }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ item });
  });

  it('maps an unknown id to 404', async () => {
    getActorMock.mockResolvedValue(actor);
    detailMock.mockResolvedValue(err('NOT_FOUND', 'Тайтл не найден в TMDB'));

    const response = await detailRoute(
      new Request('http://localhost/api/catalog/detail?kind=film&id=999', { headers: origin }),
    );
    expect(response.status).toBe(404);
  });

  it('caches a successful detail response in the browser for up to an hour', async () => {
    getActorMock.mockResolvedValue(actor);
    detailMock.mockResolvedValue(ok({ kind: 'film', externalId: '27205', title: 'Начало' }));

    const response = await detailRoute(
      new Request('http://localhost/api/catalog/detail?kind=film&id=27205', { headers: origin }),
    );
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('cache-control') ?? '';
    expect(cacheControl).toBe('private, max-age=3600');
    expect(cacheControl).not.toContain('public');
    expect(cacheControl).not.toContain('s-maxage');
  });
});
