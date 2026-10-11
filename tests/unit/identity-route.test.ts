import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { getActorMock, updateIdentityMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  updateIdentityMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/auth', async () => {
  const schema = await vi.importActual<typeof import('@/modules/auth/schema')>(
    '@/modules/auth/schema',
  );
  return { identityUpdateInput: schema.identityUpdateInput, updateIdentity: updateIdentityMock };
});

import { PATCH } from '@/app/api/me/identity/route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/me/identity', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  });
}

describe('identity mutation route', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await PATCH(request({ name: 'Ника' }));
    expect(response.status).toBe(401);
    expect(updateIdentityMock).not.toHaveBeenCalled();
  });

  it('returns the updated identity with a session', async () => {
    getActorMock.mockResolvedValue({ id: 1, role: 'employee' });
    updateIdentityMock.mockResolvedValue(ok({ name: 'Ника', handle: 'nick-1' }));

    const response = await PATCH(request({ name: 'Ника', handle: 'nick-1' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'Ника', handle: 'nick-1' });
    expect(updateIdentityMock).toHaveBeenCalledWith(
      { id: 1, role: 'employee' },
      { name: 'Ника', handle: 'nick-1' },
    );
  });

  it('rejects invalid input before the handler', async () => {
    getActorMock.mockResolvedValue({ id: 1, role: 'employee' });
    const response = await PATCH(request({ handle: 'Admin' }));
    expect(response.status).toBe(400);
    expect(updateIdentityMock).not.toHaveBeenCalled();
  });

  it('maps a conflict to 409 with the server message', async () => {
    getActorMock.mockResolvedValue({ id: 1, role: 'employee' });
    updateIdentityMock.mockResolvedValue(err('CONFLICT', 'Этот тэг уже занят'));

    const response = await PATCH(request({ handle: 'taken' }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Этот тэг уже занят', code: 'CONFLICT' });
  });
});
