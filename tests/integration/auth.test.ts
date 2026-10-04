import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { closePool, query } from '@/core/db/pool';
import { resolveActor } from '@/modules/auth/actor';
import { authorizeDemoUser } from '@/modules/auth/demo';
import { insertUser } from '@/modules/auth/repository';

afterAll(async () => {
  await closePool();
});

describe('demo login', () => {
  it('authenticates by creating the user on first login and reusing it after', async () => {
    const email = `${randomUUID()}@demo.local`;
    const first = await authorizeDemoUser({ email, name: 'Demo' });
    expect(first?.email).toBe(email);
    expect(first?.id).toBeTruthy();

    const second = await authorizeDemoUser({ email, name: 'Demo' });
    expect(second?.id).toBe(first?.id);
  });

  it('rejects invalid credentials', async () => {
    expect(await authorizeDemoUser({ email: 'not-an-email' })).toBeNull();
  });
});

describe('actor resolution', () => {
  it('reads the role from the database (not from the caller)', async () => {
    const row = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Admin',
      role: 'admin',
    });
    const actor = await resolveActor(row.id);
    expect(actor).toEqual({ id: row.id, role: 'admin', email: row.email });
  });

  it('treats a removed user as unauthenticated', async () => {
    const row = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Gone',
      role: 'employee',
    });
    await query('DELETE FROM users WHERE id = $1', [row.id]);
    expect(await resolveActor(row.id)).toBeNull();
  });

  it('returns null when there is no user id', async () => {
    expect(await resolveActor(undefined)).toBeNull();
  });
});
