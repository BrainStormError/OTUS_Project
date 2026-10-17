import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/core/result';

const {
  getActorMock,
  getFriendsMock,
  getIncomingMock,
  getOutgoingMock,
  getGroupsMock,
  getDiscoverMock,
  getInvitationsMock,
  getOwnProfileMock,
  getPrivacyMock,
} = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  getFriendsMock: vi.fn(),
  getIncomingMock: vi.fn(),
  getOutgoingMock: vi.fn(),
  getGroupsMock: vi.fn(),
  getDiscoverMock: vi.fn(),
  getInvitationsMock: vi.fn(),
  getOwnProfileMock: vi.fn(),
  getPrivacyMock: vi.fn(),
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
    createGroup: vi.fn(),
    getDiscoverableGroups: getDiscoverMock,
    getGroups: getGroupsMock,
    listMyInvitations: getInvitationsMock,
  };
});

vi.mock('@/modules/auth', async () => {
  const schema = await vi.importActual<typeof import('@/modules/auth/schema')>(
    '@/modules/auth/schema',
  );
  return {
    identityUpdateInput: schema.identityUpdateInput,
    privacyInput: schema.privacyInput,
    updateIdentity: vi.fn(),
    updatePrivacy: vi.fn(),
    getPrivacy: getPrivacyMock,
  };
});

vi.mock('@/modules/profiles', () => ({
  getOwnProfile: getOwnProfileMock,
  getProfileByHandle: vi.fn(),
}));

import { GET as friendsRead } from '@/app/api/friendships/route';
import { GET as groupsRead } from '@/app/api/groups/route';
import { GET as identityRead } from '@/app/api/me/identity/route';
import { GET as privacyRead } from '@/app/api/me/privacy/route';
import { GET as profileRead } from '@/app/api/me/profile/route';
import { GET as statsRead } from '@/app/api/me/stats/route';

const actor = { id: 1, role: 'employee' as const, name: 'Алексей', handle: 'me' };

function get(url: string): Request {
  return new Request(`http://localhost${url}`, {
    headers: { 'sec-fetch-site': 'same-origin' },
  });
}

const profile = {
  identity: {
    id: 1,
    name: 'Алексей',
    handle: 'me',
    profileHidden: false,
    statsHidden: false,
  },
  isOwn: true,
  profileRestricted: false,
  statsRestricted: false,
  relationship: null,
  stats: { count: 0, genres: [], years: [] },
  recent: [],
};

function expectSingleAuthorPolicy(response: Response): void {
  const cacheControl = response.headers.get('cache-control') ?? '';
  expect(cacheControl).toBe('private, max-age=31536000');
  expect(cacheControl).not.toContain('public');
  expect(cacheControl).not.toContain('s-maxage');
}

describe('single-author reads are cached until a mutation invalidates them', () => {
  it('caches the friends list permanently', async () => {
    getActorMock.mockResolvedValue(actor);
    getFriendsMock.mockResolvedValue(ok([]));
    getIncomingMock.mockResolvedValue(ok([]));
    getOutgoingMock.mockResolvedValue(ok([]));

    const response = await friendsRead(get('/api/friendships'));
    expect(response.status).toBe(200);
    expectSingleAuthorPolicy(response);
  });

  it('caches the groups list permanently', async () => {
    getActorMock.mockResolvedValue(actor);
    getGroupsMock.mockResolvedValue(ok([]));
    getDiscoverMock.mockResolvedValue(ok([]));
    getInvitationsMock.mockResolvedValue(ok([]));

    const response = await groupsRead(get('/api/groups'));
    expect(response.status).toBe(200);
    expectSingleAuthorPolicy(response);
  });

  it('caches the profile and settings reads permanently', async () => {
    getActorMock.mockResolvedValue(actor);
    getOwnProfileMock.mockResolvedValue(ok(profile));
    getPrivacyMock.mockResolvedValue(ok({ profileHidden: true, statsHidden: false }));

    for (const route of [identityRead, privacyRead, profileRead, statsRead]) {
      const response = await route(get('/api/me/profile'));
      expect(response.status).toBe(200);
      expectSingleAuthorPolicy(response);
    }
  });
});
