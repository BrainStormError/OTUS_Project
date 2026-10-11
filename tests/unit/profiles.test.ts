import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUserByHandleMock, findUserByIdMock, listPersonalRatingsMock, getRelationshipMock } =
  vi.hoisted(() => ({
    findUserByHandleMock: vi.fn(),
    findUserByIdMock: vi.fn(),
    listPersonalRatingsMock: vi.fn(),
    getRelationshipMock: vi.fn(),
  }));

vi.mock('@/modules/auth/users', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/auth/users')>()),
  findUserByHandle: findUserByHandleMock,
  findUserById: findUserByIdMock,
}));

vi.mock('@/modules/ratings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/ratings')>()),
  listPersonalRatings: listPersonalRatingsMock,
}));

vi.mock('@/modules/friendships', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/friendships')>()),
  getRelationship: getRelationshipMock,
}));

import type { UserRow } from '@/modules/auth/types';
import { getOwnProfile, getProfileByHandle } from '@/modules/profiles/service';

function user(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 2,
    email: 'maria@example.com',
    name: 'Мария',
    handle: 'maria',
    role: 'employee',
    provider: null,
    providerSubject: null,
    profileHidden: false,
    statsHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  listPersonalRatingsMock.mockResolvedValue([]);
});

describe('profile relationship', () => {
  it('adds the viewer relationship for another user profile', async () => {
    findUserByHandleMock.mockResolvedValue(user());
    getRelationshipMock.mockResolvedValue({ status: 'friend', friendshipId: 33 });

    const result = await getProfileByHandle({ id: 1, role: 'employee' }, 'maria');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relationship).toEqual({ status: 'friend', friendshipId: 33 });
    expect(getRelationshipMock).toHaveBeenCalledWith(1, 2);
  });

  it('carries the pending direction through', async () => {
    findUserByHandleMock.mockResolvedValue(user());
    getRelationshipMock.mockResolvedValue({ status: 'pending_out', friendshipId: 44 });

    const result = await getProfileByHandle({ id: 1, role: 'employee' }, 'maria');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relationship).toEqual({ status: 'pending_out', friendshipId: 44 });
  });

  it('has no relationship for an anonymous viewer', async () => {
    findUserByHandleMock.mockResolvedValue(user());

    const result = await getProfileByHandle(null, 'maria');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relationship).toBeNull();
    expect(getRelationshipMock).not.toHaveBeenCalled();
  });

  it('has no relationship for the owner own profile', async () => {
    findUserByIdMock.mockResolvedValue(user({ id: 1 }));

    const result = await getOwnProfile({ id: 1, role: 'employee' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relationship).toBeNull();
    expect(getRelationshipMock).not.toHaveBeenCalled();
  });
});
