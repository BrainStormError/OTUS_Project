import { describe, expect, it, vi } from 'vitest';

const {
  listOutgoingMock,
  listFriendsMock,
  findFriendshipByIdMock,
  deleteAcceptedFriendshipMock,
  findFriendshipBetweenMock,
} = vi.hoisted(() => ({
  listOutgoingMock: vi.fn(),
  listFriendsMock: vi.fn(),
  findFriendshipByIdMock: vi.fn(),
  deleteAcceptedFriendshipMock: vi.fn(),
  findFriendshipBetweenMock: vi.fn(),
}));

vi.mock('@/modules/friendships/repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/friendships/repository')>()),
  listOutgoingRequests: listOutgoingMock,
  listFriends: listFriendsMock,
  findFriendshipById: findFriendshipByIdMock,
  deleteAcceptedFriendship: deleteAcceptedFriendshipMock,
  findFriendshipBetween: findFriendshipBetweenMock,
}));

import {
  getFriends,
  getOutgoingRequests,
  getRelationship,
  removeFriend,
} from '@/modules/friendships/service';
import type { Friendship } from '@/modules/friendships/types';

const actor = { id: 1, role: 'employee' as const };

function friendship(overrides: Partial<Friendship> = {}): Friendship {
  return {
    id: 7,
    requesterId: 1,
    addresseeId: 2,
    status: 'accepted',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('getOutgoingRequests', () => {
  it('returns the outgoing requests for the actor', async () => {
    const outgoing = [
      { id: 1, user: { id: 2, name: 'Мария', handle: 'maria' } },
    ];
    listOutgoingMock.mockResolvedValue(outgoing);

    const result = await getOutgoingRequests(actor);

    expect(result).toEqual({ ok: true, value: outgoing });
    expect(listOutgoingMock).toHaveBeenCalledWith(1);
  });

  it('returns an empty list when nothing is pending', async () => {
    listOutgoingMock.mockResolvedValue([]);

    const result = await getOutgoingRequests(actor);

    expect(result).toEqual({ ok: true, value: [] });
  });
});

describe('getFriends', () => {
  it('returns friendship entries for the actor', async () => {
    const entries = [
      { friendshipId: 7, user: { id: 2, name: 'Мария', handle: 'maria' } },
    ];
    listFriendsMock.mockResolvedValue(entries);

    const result = await getFriends(actor);

    expect(result).toEqual({ ok: true, value: entries });
    expect(listFriendsMock).toHaveBeenCalledWith(1);
  });
});

describe('removeFriend', () => {
  it('removes an accepted friendship the actor belongs to', async () => {
    const row = friendship({ requesterId: actor.id, addresseeId: 2, status: 'accepted' });
    findFriendshipByIdMock.mockResolvedValue(row);
    deleteAcceptedFriendshipMock.mockResolvedValue(row);

    const result = await removeFriend(actor, { friendshipId: row.id });

    expect(result).toEqual({ ok: true, value: row });
    expect(deleteAcceptedFriendshipMock).toHaveBeenCalledWith(row.id, actor.id);
  });

  it('reports a missing friendship as not found', async () => {
    findFriendshipByIdMock.mockResolvedValue(null);

    const result = await removeFriend(actor, { friendshipId: 7 });

    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(deleteAcceptedFriendshipMock).not.toHaveBeenCalled();
  });

  it('forbids an actor who is not a party', async () => {
    findFriendshipByIdMock.mockResolvedValue(
      friendship({ requesterId: 5, addresseeId: 6, status: 'accepted' }),
    );

    const result = await removeFriend(actor, { friendshipId: 7 });

    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(deleteAcceptedFriendshipMock).not.toHaveBeenCalled();
  });

  it('reports a non-accepted friendship as a conflict', async () => {
    findFriendshipByIdMock.mockResolvedValue(friendship({ status: 'pending' }));

    const result = await removeFriend(actor, { friendshipId: 7 });

    expect(result).toMatchObject({ ok: false, code: 'CONFLICT' });
    expect(deleteAcceptedFriendshipMock).not.toHaveBeenCalled();
  });
});

describe('getRelationship', () => {
  it('reports no relationship when none exists or it was declined', async () => {
    findFriendshipBetweenMock.mockResolvedValue(null);
    expect(await getRelationship(1, 2)).toEqual({ status: 'none', friendshipId: null });

    findFriendshipBetweenMock.mockResolvedValue(friendship({ status: 'declined' }));
    expect(await getRelationship(1, 2)).toEqual({ status: 'none', friendshipId: null });
  });

  it('reports an accepted friendship as a friend with its id', async () => {
    findFriendshipBetweenMock.mockResolvedValue(friendship({ id: 9, status: 'accepted' }));
    expect(await getRelationship(1, 2)).toEqual({ status: 'friend', friendshipId: 9 });
  });

  it('derives the pending direction from the requester', async () => {
    findFriendshipBetweenMock.mockResolvedValue(
      friendship({ id: 4, requesterId: 1, addresseeId: 2, status: 'pending' }),
    );
    expect(await getRelationship(1, 2)).toEqual({ status: 'pending_out', friendshipId: 4 });

    findFriendshipBetweenMock.mockResolvedValue(
      friendship({ id: 5, requesterId: 2, addresseeId: 1, status: 'pending' }),
    );
    expect(await getRelationship(1, 2)).toEqual({ status: 'pending_in', friendshipId: 5 });
  });
});
