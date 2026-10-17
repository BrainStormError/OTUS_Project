import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { getActorMock, listMock, deleteMock, saveMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  listMock: vi.fn(),
  deleteMock: vi.fn(),
  saveMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/records', async () => {
  const schema = await vi.importActual<typeof import('@/modules/records/schema')>(
    '@/modules/records/schema',
  );
  return {
    upsertWatchedRecordInput: schema.upsertWatchedRecordInput,
    listWatchedRecords: listMock,
    deleteWatchedRecord: deleteMock,
    saveWatchedRecord: saveMock,
  };
});

import {
  DELETE as deleteRoute,
  GET as listRoute,
  POST as saveRoute,
} from '@/app/api/records/route';

const actor = { id: 1, role: 'employee' as const };
const origin = { origin: 'http://localhost:3000' };

describe('GET /api/records', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    expect((await listRoute()).status).toBe(401);
  });

  it('returns the account records', async () => {
    getActorMock.mockResolvedValue(actor);
    const items = [
      {
        id: 7,
        mediaKind: 'film',
        mediaRef: '27205',
        title: 'Начало',
        rating: 9,
        watchedAt: '2026-08-12',
      },
    ];
    listMock.mockResolvedValue(ok(items));

    const response = await listRoute();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items });
  });

  it('keeps the record list cacheable until a mutation invalidates it', async () => {
    getActorMock.mockResolvedValue(actor);
    listMock.mockResolvedValue(ok([]));

    const response = await listRoute();
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('cache-control') ?? '';
    expect(cacheControl).toBe('private, max-age=31536000');
    expect(cacheControl).not.toContain('public');
    expect(cacheControl).not.toContain('s-maxage');
  });
});

describe('POST /api/records', () => {
  function save(body: unknown): Request {
    return new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { ...origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('saves the record for the owner', async () => {
    getActorMock.mockResolvedValue(actor);
    saveMock.mockResolvedValue(ok({ id: 7 }));
    const response = await saveRoute(
      save({ mediaKind: 'film', mediaRef: '27205', rating: 9, watchedAt: '2026-10-15' }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 7 });
  });

  it('leaves mutation responses without a cache policy', async () => {
    getActorMock.mockResolvedValue(actor);
    saveMock.mockResolvedValue(ok({ id: 7 }));
    const response = await saveRoute(
      save({ mediaKind: 'film', mediaRef: '27205', rating: 9, watchedAt: '2026-10-15' }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBeNull();
  });

  it('returns the service error when the save fails', async () => {
    getActorMock.mockResolvedValue(actor);
    saveMock.mockResolvedValue(err('NOT_FOUND', 'Запись не найдена'));
    const response = await saveRoute(
      save({ mediaKind: 'film', mediaRef: '27205', rating: 9, watchedAt: '2026-10-15' }),
    );
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/records', () => {
  function request(id: string): Request {
    return new Request(`http://localhost/api/records?id=${id}`, {
      method: 'DELETE',
      headers: origin,
    });
  }

  it('returns 400 for a non-numeric id', async () => {
    getActorMock.mockResolvedValue(actor);
    expect((await deleteRoute(request('nope'))).status).toBe(400);
  });

  it('maps a foreign record to 404', async () => {
    getActorMock.mockResolvedValue(actor);
    deleteMock.mockResolvedValue(err('NOT_FOUND', 'Запись не найдена'));
    const response = await deleteRoute(request('7'));
    expect(response.status).toBe(404);
    expect(deleteMock).toHaveBeenCalledWith(actor, 7);
  });

  it('removes the record for the owner', async () => {
    getActorMock.mockResolvedValue(actor);
    deleteMock.mockResolvedValue(ok({ id: 7 }));
    const response = await deleteRoute(request('7'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 7 });
  });
});
