import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { closePool, query } from '@/core/db/pool';
import { resolveActor } from '@/modules/auth/actor';
import { authorizeDemoUser } from '@/modules/auth/demo';
import { insertUser, updatePrivacy } from '@/modules/auth/repository';

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
    expect(actor).toEqual({
      id: row.id,
      role: 'admin',
      email: row.email,
      name: row.name,
      handle: row.handle,
    });
    expect(actor?.handle).toBeTruthy();
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

describe('privacy persistence', () => {
  it('round-trips the profile and statistics privacy flags', async () => {
    const row = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Privacy',
      role: 'employee',
    });
    expect(row.profileHidden).toBe(false);
    expect(row.statsHidden).toBe(false);

    const updated = await updatePrivacy(row.id, {
      profileHidden: true,
      statsHidden: true,
    });
    expect(updated?.profileHidden).toBe(true);
    expect(updated?.statsHidden).toBe(true);

    const partial = await updatePrivacy(row.id, { profileHidden: false });
    expect(partial?.profileHidden).toBe(false);
    expect(partial?.statsHidden).toBe(true);
  });
});
