import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUserByHandleMock, updateIdentityRowMock } = vi.hoisted(() => ({
  findUserByHandleMock: vi.fn(),
  updateIdentityRowMock: vi.fn(),
}));

vi.mock('@/modules/auth/repository', () => ({
  bindProviderSubject: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserByProviderSubject: vi.fn(),
  insertUser: vi.fn(),
  findUserByHandle: findUserByHandleMock,
  updateIdentity: updateIdentityRowMock,
}));

import { updateIdentity } from '@/modules/auth/identity';
import type { UserRow } from '@/modules/auth/types';

const actor = { id: 1, role: 'employee' as const };

function user(overrides: Partial<UserRow>): UserRow {
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
  findUserByHandleMock.mockResolvedValue(null);
});

describe('updateIdentity', () => {
  it('updates the display name for the owner', async () => {
    updateIdentityRowMock.mockResolvedValue({
      status: 'updated',
      user: user({ name: 'Новое имя' }),
    });

    const result = await updateIdentity(actor, { name: '  Новое имя  ' });

    expect(result).toEqual({ ok: true, value: { name: 'Новое имя', handle: 'old-tag' } });
    expect(updateIdentityRowMock).toHaveBeenCalledWith(1, {
      name: 'Новое имя',
      handle: undefined,
    });
  });

  it('rejects an invalid format with a validation error', async () => {
    const result = await updateIdentity(actor, { handle: 'Admin' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('VALIDATION');
    }
    expect(updateIdentityRowMock).not.toHaveBeenCalled();
  });

  it('rejects an empty body and reserved tags', async () => {
    for (const input of [{}, { handle: 'admin' }, { handle: 'root' }]) {
      const result = await updateIdentity(actor, input);
      expect(result.ok, JSON.stringify(input)).toBe(false);
    }
  });

  it('rejects a tag already used by another account', async () => {
    findUserByHandleMock.mockResolvedValue(user({ id: 2, handle: 'taken' }));

    const result = await updateIdentity(actor, { handle: 'taken' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CONFLICT');
    }
    expect(updateIdentityRowMock).not.toHaveBeenCalled();
  });

  it('treats the actor own current tag as a no-op success', async () => {
    findUserByHandleMock.mockResolvedValue(user({ id: 1, handle: 'old-tag' }));
    updateIdentityRowMock.mockResolvedValue({
      status: 'updated',
      user: user({ handle: 'old-tag' }),
    });

    const result = await updateIdentity(actor, { handle: 'old-tag' });

    expect(result).toEqual({ ok: true, value: { name: 'Старое', handle: 'old-tag' } });
  });

  it('reports the remaining cooldown when the tag change is blocked', async () => {
    updateIdentityRowMock.mockResolvedValue({
      status: 'cooldown',
      availableAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });

    const result = await updateIdentity(actor, { handle: 'new-tag' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CONFLICT');
      expect(result.message).toContain('дн');
    }
  });

  it('reports a missing user', async () => {
    updateIdentityRowMock.mockResolvedValue({ status: 'not_found' });

    const result = await updateIdentity(actor, { name: 'Ника' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('NOT_FOUND');
    }
  });

  it('maps a race-time unique violation to a conflict', async () => {
    updateIdentityRowMock.mockResolvedValue({ status: 'handle_taken' });

    const result = await updateIdentity(actor, { handle: 'race' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CONFLICT');
    }
  });
});
