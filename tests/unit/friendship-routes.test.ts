import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { getActorMock, searchUsersMock, createFriendRequestMock, withdrawFriendRequestMock } =
  vi.hoisted(() => ({
    getActorMock: vi.fn(),
    searchUsersMock: vi.fn(),
    createFriendRequestMock: vi.fn(),
    withdrawFriendRequestMock: vi.fn(),
  }));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/friendships', async () => {
  const schema = await vi.importActual<typeof import('@/modules/friendships/schema')>(
    '@/modules/friendships/schema',
  );
  return {
    userSearchInput: schema.userSearchInput,
    createFriendRequestInput: schema.createFriendRequestInput,
    friendshipDecisionInput: schema.friendshipDecisionInput,
    searchUsers: searchUsersMock,
    createFriendRequest: createFriendRequestMock,
    withdrawFriendRequest: withdrawFriendRequestMock,
  };
});

import { GET as searchRoute } from '@/app/api/friendships/search/route';
import { POST as createRoute } from '@/app/api/friendships/route';
import { DELETE as withdrawRoute } from '@/app/api/friendships/[id]/route';

const actor = { id: 1, role: 'employee' as const };
const origin = { origin: 'http://localhost:3000' };

function searchRequest(query: string): Request {
  return new Request(`http://localhost/api/friendships/search${query}`, { headers: origin });
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/friendships', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...origin },
    body: JSON.stringify(body),
  });
}

function withdrawRequest(id: string): { request: Request; context: { params: Promise<{ id: string }> } } {
  return {
    request: new Request(`http://localhost/api/friendships/${id}`, {
      method: 'DELETE',
      headers: origin,
    }),
    context: { params: Promise.resolve({ id }) },
  };
}

describe('GET /api/friendships/search', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await searchRoute(searchRequest('?q=иван'));
    expect(response.status).toBe(401);
  });

  it('returns 400 for an invalid query', async () => {
    getActorMock.mockResolvedValue(actor);
    expect((await searchRoute(searchRequest('?q='))).status).toBe(400);
    expect((await searchRoute(searchRequest('?q=%20%20'))).status).toBe(400);
    expect((await searchRoute(searchRequest(''))).status).toBe(400);
  });

  it('returns the search results for a valid query', async () => {
    getActorMock.mockResolvedValue(actor);
    const items = [
      { id: 2, name: 'Мария', handle: 'maria', relationship: 'friend' },
    ];
    searchUsersMock.mockResolvedValue(ok(items));

    const response = await searchRoute(searchRequest('?q=%20Мария%20'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items });
    expect(searchUsersMock).toHaveBeenCalledWith(actor, { q: 'Мария' });
  });
});

describe('POST /api/friendships', () => {
  it('returns 400 for an invalid addressee', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await createRoute(createRequest({ addresseeId: 'not-a-number' }));
    expect(response.status).toBe(400);
  });

  it('maps a forbidden self request to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    createFriendRequestMock.mockResolvedValue(err('FORBIDDEN', 'Нельзя отправить заявку самому себе'));

    const response = await createRoute(createRequest({ addresseeId: 7 }));

    expect(response.status).toBe(403);
  });

  it('maps a duplicate pending request to 409', async () => {
    getActorMock.mockResolvedValue(actor);
    createFriendRequestMock.mockResolvedValue(err('CONFLICT', 'Заявка уже отправлена'));

    const response = await createRoute(createRequest({ addresseeId: 7 }));

    expect(response.status).toBe(409);
  });

  it('creates the request for a valid addressee', async () => {
    getActorMock.mockResolvedValue(actor);
    createFriendRequestMock.mockResolvedValue(ok({ id: 7, status: 'pending' }));

    const response = await createRoute(createRequest({ addresseeId: 7 }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 7, status: 'pending' });
  });
});

describe('DELETE /api/friendships/[id]', () => {
  it('returns 400 for a non-numeric id', async () => {
    getActorMock.mockResolvedValue(actor);
    const { request, context } = withdrawRequest('nope');
    const response = await withdrawRoute(request, context);
    expect(response.status).toBe(400);
  });

  it('maps a foreign request to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    withdrawFriendRequestMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));

    const { request, context } = withdrawRequest('7');
    const response = await withdrawRoute(request, context);

    expect(response.status).toBe(403);
    expect(withdrawFriendRequestMock).toHaveBeenCalledWith(actor, { friendshipId: 7 });
  });

  it('maps an unknown request to 404', async () => {
    getActorMock.mockResolvedValue(actor);
    withdrawFriendRequestMock.mockResolvedValue(err('NOT_FOUND', 'Заявка не найдена'));

    const { request, context } = withdrawRequest('8');
    const response = await withdrawRoute(request, context);

    expect(response.status).toBe(404);
  });

  it('withdraws the request for the owner', async () => {
    getActorMock.mockResolvedValue(actor);
    withdrawFriendRequestMock.mockResolvedValue(ok({ id: 7 }));

    const { request, context } = withdrawRequest('7');
    const response = await withdrawRoute(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 7 });
  });
});
