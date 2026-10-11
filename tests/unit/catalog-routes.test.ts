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

  it('returns search results for a valid query', async () => {
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
    searchMock.mockResolvedValue(ok(items));

    const response = await searchRoute(
      new Request('http://localhost/api/search?kind=film&q=Начало&genre=878&year=2010', {
        headers: origin,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items });
    expect(searchMock).toHaveBeenCalledWith({
      kind: 'film',
      title: 'Начало',
      genreIds: [878],
      year: 2010,
    });
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

  it('returns the stored genres', async () => {
    getActorMock.mockResolvedValue(actor);
    const items = [
      { id: 18, name: 'Драма' },
      { id: 878, name: 'Фантастика' },
    ];
    genresMock.mockResolvedValue(ok(items));

    const response = await genresRoute(
      new Request('http://localhost/api/genres', { headers: origin }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items });
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
});
