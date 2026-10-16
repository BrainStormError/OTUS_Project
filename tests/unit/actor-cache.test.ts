import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUserByIdMock, updateIdentityRowMock } = vi.hoisted(() => ({
  findUserByIdMock: vi.fn(),
  updateIdentityRowMock: vi.fn(),
}));

vi.mock('@/modules/auth/repository', () => ({
  findUserById: findUserByIdMock,
  findUserByHandle: vi.fn(async () => null),
  updateIdentity: updateIdentityRowMock,
}));

import {
  ACTOR_CACHE_TTL_MS,
  invalidateActor,
  resolveActor,
} from '@/modules/auth/actor';
import { updateIdentity } from '@/modules/auth/identity';
import type { UserRow } from '@/modules/auth/types';

function user(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 1,
    email: 'me@example.com',
    name: 'Старое',
    handle: 'old-tag',
    role: 'employee',
    provider: null,
    providerSubject: null,
    profileHidden: false,
    statsHidden: false,
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const id of [1, 2, 3, 4, 5]) {
    invalidateActor(id);
  }
});

describe('actor cache', () => {
  it('reads the database once within the TTL', async () => {
    findUserByIdMock.mockResolvedValue(user({ id: 1 }));

    await resolveActor(1);
    await resolveActor(1);

    expect(findUserByIdMock).toHaveBeenCalledTimes(1);
  });

  it('re-reads the database after the TTL expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    findUserByIdMock.mockResolvedValue(user({ id: 2 }));

    await resolveActor(2);
    await resolveActor(2);
    expect(findUserByIdMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date(Date.now() + ACTOR_CACHE_TTL_MS + 1));
    await resolveActor(2);
    expect(findUserByIdMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('derives the role from the database row', async () => {
    findUserByIdMock.mockResolvedValue(user({ id: 5, role: 'admin' }));

    expect((await resolveActor(5))?.role).toBe('admin');
  });

  it('reflects an identity mutation immediately, without waiting for the TTL', async () => {
    findUserByIdMock.mockResolvedValue(user({ id: 3, name: 'Старое' }));
    expect((await resolveActor(3))?.name).toBe('Старое');

    updateIdentityRowMock.mockResolvedValue({
      status: 'updated',
      user: user({ id: 3, name: 'Новое' }),
    });
    findUserByIdMock.mockResolvedValue(user({ id: 3, name: 'Новое' }));

    const result = await updateIdentity({ id: 3, role: 'employee' }, { name: 'Новое' });
    expect(result.ok).toBe(true);

    expect((await resolveActor(3))?.name).toBe('Новое');
    expect(findUserByIdMock).toHaveBeenCalledTimes(2);
  });

  it('denies a removed user once the cached entry expires or is invalidated', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    findUserByIdMock.mockResolvedValue(user({ id: 4 }));
    expect(await resolveActor(4)).not.toBeNull();

    findUserByIdMock.mockResolvedValue(null);
    expect(await resolveActor(4)).not.toBeNull();

    invalidateActor(4);
    expect(await resolveActor(4)).toBeNull();

    vi.setSystemTime(new Date(Date.now() + ACTOR_CACHE_TTL_MS + 1));
    findUserByIdMock.mockResolvedValue(user({ id: 4 }));
    expect(await resolveActor(4)).not.toBeNull();
    findUserByIdMock.mockResolvedValue(null);
    vi.setSystemTime(new Date(Date.now() + ACTOR_CACHE_TTL_MS + 1));
    expect(await resolveActor(4)).toBeNull();

    vi.useRealTimers();
  });
});
