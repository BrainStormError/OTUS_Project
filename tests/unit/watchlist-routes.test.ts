import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { getActorMock, listMock, addMock, deleteMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  listMock: vi.fn(),
  addMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/watchlist', async () => {
  const schema = await vi.importActual<typeof import('@/modules/watchlist/schema')>(
    '@/modules/watchlist/schema',
  );
  return {
    addWatchlistInput: schema.addWatchlistInput,
    listWatchlist: listMock,
    addWatchlist: addMock,
    removeWatchlist: deleteMock,
  };
});

import { DELETE as deleteRoute, GET as listRoute, POST as addRoute } from '@/app/api/watchlist/route';

const actor = { id: 1, role: 'employee' as const };
const origin = { origin: 'http://localhost:3000' };

function get(kind?: string): Request {
  const url = kind ? `http://localhost/api/watchlist?kind=${kind}` : 'http://localhost/api/watchlist';
  return new Request(url);
}

function add(body: unknown): Request {
  return new Request('http://localhost/api/watchlist', {
    method: 'POST',
    headers: { ...origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/watchlist', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    expect((await listRoute(get('film'))).status).toBe(401);
  });

  it('returns 400 for a missing or invalid kind', async () => {
    getActorMock.mockResolvedValue(actor);
    expect((await listRoute(get())).status).toBe(400);
    expect((await listRoute(get('book'))).status).toBe(400);
  });

  it('returns the account watch-later items for the kind', async () => {
    getActorMock.mockResolvedValue(actor);
    const items = [{ id: 1, mediaKind: 'film', mediaRef: '27205', title: 'Начало' }];
    listMock.mockResolvedValue(ok(items));

    const response = await listRoute(get('film'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items });
    expect(listMock).toHaveBeenCalledWith(actor, 'film');
  });

  it('keeps the watch-later list cacheable until a mutation invalidates it', async () => {
    getActorMock.mockResolvedValue(actor);
    listMock.mockResolvedValue(ok([]));

    const response = await listRoute(get('film'));
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('cache-control') ?? '';
    expect(cacheControl).toBe('private, max-age=31536000');
    expect(cacheControl).not.toContain('public');
    expect(cacheControl).not.toContain('s-maxage');
  });
});

describe('POST /api/watchlist', () => {
  it('adds an entry through the service', async () => {
    getActorMock.mockResolvedValue(actor);
    addMock.mockResolvedValue(ok({ id: 5 }));

    const response = await addRoute(add({ mediaKind: 'film', mediaRef: '27205' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 5 });
    expect(addMock).toHaveBeenCalledWith(actor, { mediaKind: 'film', mediaRef: '27205' });
  });

  it('maps a conflict to 409', async () => {
    getActorMock.mockResolvedValue(actor);
    addMock.mockResolvedValue(err('CONFLICT', 'Тайтл уже отмечен просмотренным'));

    expect((await addRoute(add({ mediaKind: 'film', mediaRef: '27205' }))).status).toBe(409);
  });
});

describe('DELETE /api/watchlist', () => {
  function remove(id: string): Request {
    return new Request(`http://localhost/api/watchlist?id=${id}`, {
      method: 'DELETE',
      headers: origin,
    });
  }

  it('returns 400 for a non-numeric id', async () => {
    getActorMock.mockResolvedValue(actor);
    expect((await deleteRoute(remove('nope'))).status).toBe(400);
  });

  it('removes the entry for its owner', async () => {
    getActorMock.mockResolvedValue(actor);
    deleteMock.mockResolvedValue(ok({ id: 7 }));
    const response = await deleteRoute(remove('7'));
    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith(actor, 7);
  });

  it('returns the service error when the removal fails', async () => {
    getActorMock.mockResolvedValue(actor);
    deleteMock.mockResolvedValue(err('NOT_FOUND', 'Запись не найдена'));
    expect((await deleteRoute(remove('7'))).status).toBe(404);
  });
});
