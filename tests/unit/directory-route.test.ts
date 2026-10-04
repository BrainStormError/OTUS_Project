import { describe, expect, it, vi } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { ok } from '@/core/result';
import { createDirectoryEntry } from '@/modules/directory';

vi.mock('@/modules/auth/session', () => ({
  getActor: async () => null,
}));

import { createDirectoryPostRoute } from '@/app/api/directory/route-factory';

const admin: Actor = { id: 'admin-1', role: 'admin' };
const employee: Actor = { id: 'emp-1', role: 'employee' };

function request(body: unknown): Request {
  return new Request('http://localhost/api/directory', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  });
}

describe('directory mutation route', () => {
  it('returns 401 without a session', async () => {
    const route = createDirectoryPostRoute({
      resolveActor: async () => null,
      create: async () => ok({ id: 'x' }),
    });
    expect((await route(request({ name: 'A' }))).status).toBe(401);
  });

  it('returns 403 when the policy denies the actor', async () => {
    const route = createDirectoryPostRoute({
      resolveActor: async () => employee,
      create: async (actor, input) => {
        const result = await createDirectoryEntry(actor, input);
        return result.ok ? ok({ id: result.value.id }) : result;
      },
    });
    const response = await route(request({ name: 'A' }));
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid input', async () => {
    const route = createDirectoryPostRoute({
      resolveActor: async () => admin,
      create: async () => ok({ id: 'x' }),
    });
    expect((await route(request({ name: '' }))).status).toBe(400);
  });

  it('returns 200 on success', async () => {
    const route = createDirectoryPostRoute({
      resolveActor: async () => admin,
      create: async () => ok({ id: 'entry-1' }),
    });
    const response = await route(request({ name: 'A' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'entry-1' });
  });
});
