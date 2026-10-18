import { beforeEach, describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const {
  getActorMock,
  getFriendsMock,
  getIncomingMock,
  getOutgoingMock,
  getGroupsMock,
  getDiscoverMock,
  getInvitationsMock,
  getGroupMock,
  getGroupRoleMock,
  listGroupRatingsMock,
  listDiscussionDetailsMock,
} = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  getFriendsMock: vi.fn(),
  getIncomingMock: vi.fn(),
  getOutgoingMock: vi.fn(),
  getGroupsMock: vi.fn(),
  getDiscoverMock: vi.fn(),
  getInvitationsMock: vi.fn(),
  getGroupMock: vi.fn(),
  getGroupRoleMock: vi.fn(),
  listGroupRatingsMock: vi.fn(),
  listDiscussionDetailsMock: vi.fn(),
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
    removeFriendInput: schema.removeFriendInput,
    searchUsers: vi.fn(),
    createFriendRequest: vi.fn(),
    withdrawFriendRequest: vi.fn(),
    removeFriend: vi.fn(),
    getFriends: getFriendsMock,
    getIncomingRequests: getIncomingMock,
    getOutgoingRequests: getOutgoingMock,
  };
});

vi.mock('@/modules/groups', async () => {
  const schema = await vi.importActual<typeof import('@/modules/groups/schema')>(
    '@/modules/groups/schema',
  );
  return {
    createGroupInput: schema.createGroupInput,
    updateGroupInput: schema.updateGroupInput,
    dissolveGroupInput: schema.dissolveGroupInput,
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    dissolveGroup: vi.fn(),
    getDiscoverableGroups: getDiscoverMock,
    getGroups: getGroupsMock,
    listMyInvitations: getInvitationsMock,
    getGroup: getGroupMock,
    getGroupRole: getGroupRoleMock,
    listGroupInvitations: vi.fn(),
    listGroupRatings: listGroupRatingsMock,
  };
});

vi.mock('@/modules/discussions', () => ({
  listDiscussionDetails: listDiscussionDetailsMock,
}));

vi.mock('@/modules/activity', () => ({
  listGroupFeed: vi.fn(),
}));

import { GET as friendsRead } from '@/app/api/friendships/route';
import { GET as groupsRead } from '@/app/api/groups/route';
import { GET as groupDetailRead } from '@/app/api/groups/[id]/route';

const actor = { id: 1, role: 'employee' as const };

function get(url: string): Request {
  return new Request(`http://localhost${url}`, {
    headers: { 'sec-fetch-site': 'same-origin' },
  });
}

let inFlight = 0;
let maxInFlight = 0;

function tracked<T>(value: T): () => Promise<T> {
  return async () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 0));
    inFlight -= 1;
    return value;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  inFlight = 0;
  maxInFlight = 0;
  getActorMock.mockResolvedValue(actor);
});

describe('GET /api/friendships', () => {
  it('returns all three lists', async () => {
    getFriendsMock.mockResolvedValue(ok([{ id: 1 }]));
    getIncomingMock.mockResolvedValue(ok([{ id: 2 }]));
    getOutgoingMock.mockResolvedValue(ok([{ id: 3 }]));

    const response = await friendsRead(get('/api/friendships'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      friends: [{ id: 1 }],
      incoming: [{ id: 2 }],
      outgoing: [{ id: 3 }],
    });
  });

  it('issues the three reads one after another, never holding two at once', async () => {
    getFriendsMock.mockImplementation(tracked(ok([])));
    getIncomingMock.mockImplementation(tracked(ok([])));
    getOutgoingMock.mockImplementation(tracked(ok([])));

    await friendsRead(get('/api/friendships'));

    expect(maxInFlight).toBe(1);
    expect(getFriendsMock).toHaveBeenCalledTimes(1);
    expect(getIncomingMock).toHaveBeenCalledTimes(1);
    expect(getOutgoingMock).toHaveBeenCalledTimes(1);
  });

  it('short-circuits on the first non-ok result without reading later lists', async () => {
    getFriendsMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));

    const response = await friendsRead(get('/api/friendships'));

    expect(response.status).toBe(403);
    expect(getIncomingMock).not.toHaveBeenCalled();
    expect(getOutgoingMock).not.toHaveBeenCalled();
  });

  it('short-circuits a later failure and skips the remaining read', async () => {
    getFriendsMock.mockResolvedValue(ok([]));
    getIncomingMock.mockResolvedValue(err('NOT_FOUND', 'Нет заявок'));

    const response = await friendsRead(get('/api/friendships'));

    expect(response.status).toBe(404);
    expect(getOutgoingMock).not.toHaveBeenCalled();
  });
});

describe('GET /api/groups', () => {
  it('returns all three lists', async () => {
    getGroupsMock.mockResolvedValue(ok([{ id: 1 }]));
    getDiscoverMock.mockResolvedValue(ok([{ id: 2 }]));
    getInvitationsMock.mockResolvedValue(ok([{ id: 3 }]));

    const response = await groupsRead(get('/api/groups'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      groups: [{ id: 1 }],
      discover: [{ id: 2 }],
      invitations: [{ id: 3 }],
    });
  });

  it('issues the three reads one after another, never holding two at once', async () => {
    getGroupsMock.mockImplementation(tracked(ok([])));
    getDiscoverMock.mockImplementation(tracked(ok([])));
    getInvitationsMock.mockImplementation(tracked(ok([])));

    await groupsRead(get('/api/groups'));

    expect(maxInFlight).toBe(1);
    expect(getGroupsMock).toHaveBeenCalledTimes(1);
    expect(getDiscoverMock).toHaveBeenCalledTimes(1);
    expect(getInvitationsMock).toHaveBeenCalledTimes(1);
  });

  it('short-circuits on the first non-ok result without reading later lists', async () => {
    getGroupsMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));

    const response = await groupsRead(get('/api/groups'));

    expect(response.status).toBe(403);
    expect(getDiscoverMock).not.toHaveBeenCalled();
    expect(getInvitationsMock).not.toHaveBeenCalled();
  });
});

describe('GET /api/groups/[id]', () => {
  it('returns discussions and ratings', async () => {
    getGroupMock.mockResolvedValue(ok({ id: 3 }));
    getGroupRoleMock.mockResolvedValue(null);
    listDiscussionDetailsMock.mockResolvedValue(ok([{ id: 1 }]));
    listGroupRatingsMock.mockResolvedValue(ok([{ id: 2 }]));

    const response = await groupDetailRead(get('/api/groups/3'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      group: { id: 3 },
      role: null,
      discussions: [{ id: 1 }],
      ratings: [{ id: 2 }],
      activity: [],
      invitations: [],
    });
  });

  it('issues the two reads one after another, never holding two at once', async () => {
    getGroupMock.mockResolvedValue(ok({ id: 3 }));
    getGroupRoleMock.mockResolvedValue(null);
    listDiscussionDetailsMock.mockImplementation(tracked(ok([])));
    listGroupRatingsMock.mockImplementation(tracked(ok([])));

    await groupDetailRead(get('/api/groups/3'));

    expect(maxInFlight).toBe(1);
    expect(listDiscussionDetailsMock).toHaveBeenCalledTimes(1);
    expect(listGroupRatingsMock).toHaveBeenCalledTimes(1);
  });

  it('short-circuits on a failed discussions read without reading ratings', async () => {
    getGroupMock.mockResolvedValue(ok({ id: 3 }));
    getGroupRoleMock.mockResolvedValue(null);
    listDiscussionDetailsMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));

    const response = await groupDetailRead(get('/api/groups/3'));

    expect(response.status).toBe(403);
    expect(listGroupRatingsMock).not.toHaveBeenCalled();
  });
});
