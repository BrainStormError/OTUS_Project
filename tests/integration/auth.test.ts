import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { closePool, query } from '@/core/db/pool';
import { resolveActor } from '@/modules/auth/actor';
import { authorizeDemoUser } from '@/modules/auth/demo';
import { resolveGoogleUser, updateIdentity } from '@/modules/auth/identity';
import { findOrCreateDemoUser, insertUser, updatePrivacy } from '@/modules/auth/repository';

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

describe('demo login hardening', () => {
  it('does not impersonate a pre-existing privileged account', async () => {
    const email = `admin-${randomUUID().slice(0, 8)}@example.com`;
    const existing = await insertUser({ email, name: 'Real admin', role: 'admin' });

    expect(await findOrCreateDemoUser(email, 'Demo')).toBeNull();
    expect(await authorizeDemoUser({ email, name: 'Demo' })).toBeNull();

    const row = await query<{ role: number }>(`SELECT role FROM users WHERE id = $1`, [
      existing.id,
    ]);
    expect(row[0]?.role).toBe(1);
  });

  it('creates a new account with the least-privilege role regardless of the email text', async () => {
    const email = `admin${randomUUID().slice(0, 8)}@demo.local`;
    const created = await findOrCreateDemoUser(email, 'Demo');
    expect(created).not.toBeNull();
    expect(created?.role).toBe('employee');
  });
});

describe('google identity binding', () => {
  it('does not inherit a demo account that shares the email', async () => {
    const email = `${randomUUID()}@demo.local`;
    const demo = await findOrCreateDemoUser(email, 'Demo');
    expect(demo).not.toBeNull();

    expect(
      await resolveGoogleUser({ email, name: 'Google', subject: randomUUID() }),
    ).toBeNull();
  });

  it('does not inherit a ticket account that shares the email', async () => {
    const email = `ticket-${randomUUID()}@example.com`;
    await insertUser({ email, name: 'Ticket', role: 'employee', provider: 'ticket' });

    expect(
      await resolveGoogleUser({ email, name: 'Google', subject: randomUUID() }),
    ).toBeNull();
  });

  it('binds the subject once for a legacy email-only account', async () => {
    const email = `legacy-${randomUUID()}@example.com`;
    const legacy = await insertUser({ email, name: 'Legacy', role: 'employee' });
    const subject = randomUUID();

    const bound = await resolveGoogleUser({ email, name: 'Google', subject });
    expect(bound?.id).toBe(legacy.id);

    const again = await resolveGoogleUser({ email, name: 'Google', subject });
    expect(again?.id).toBe(legacy.id);
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

describe('identity editing', () => {
  it('updates the display name with no frequency limit', async () => {
    const user = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Old',
      role: 'employee',
    });
    const actor = { id: user.id, role: 'employee' as const };

    const first = await updateIdentity(actor, { name: 'Первый' });
    expect(first).toEqual({ ok: true, value: { name: 'Первый', handle: user.handle } });

    const second = await updateIdentity(actor, { name: 'Второй' });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.name).toBe('Второй');
    }
  });

  it('changes the tag on the first request and records the change time', async () => {
    const user = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Tag',
      role: 'employee',
    });
    const tag = `tag-${randomUUID().slice(0, 8)}`;

    const result = await updateIdentity({ id: user.id, role: 'employee' }, { handle: tag });
    expect(result).toEqual({ ok: true, value: { name: user.name, handle: tag } });

    const rows = await query<{ handle: string; handle_changed_at: Date | null }>(
      `SELECT handle, handle_changed_at FROM users WHERE id = $1`,
      [user.id],
    );
    expect(rows[0]?.handle).toBe(tag);
    expect(rows[0]?.handle_changed_at).not.toBeNull();
  });

  it('rejects a second tag change inside the cooldown and keeps the stored tag', async () => {
    const user = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Cooldown',
      role: 'employee',
    });
    const actor = { id: user.id, role: 'employee' as const };
    const first = `tag-${randomUUID().slice(0, 8)}`;
    const second = `tag-${randomUUID().slice(0, 8)}`;

    expect((await updateIdentity(actor, { handle: first })).ok).toBe(true);
    const blocked = await updateIdentity(actor, { handle: second });

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe('CONFLICT');
      expect(blocked.message).toContain('дн');
    }
    const rows = await query<{ handle: string }>(`SELECT handle FROM users WHERE id = $1`, [
      user.id,
    ]);
    expect(rows[0]?.handle).toBe(first);
  });

  it('accepts a tag change after the cooldown has elapsed', async () => {
    const user = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Elapsed',
      role: 'employee',
    });
    const actor = { id: user.id, role: 'employee' as const };
    await updateIdentity(actor, { handle: `tag-${randomUUID().slice(0, 8)}` });
    await query(`UPDATE users SET handle_changed_at = now() - interval '2 months' WHERE id = $1`, [
      user.id,
    ]);

    const next = `tag-${randomUUID().slice(0, 8)}`;
    const result = await updateIdentity(actor, { handle: next });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.handle).toBe(next);
    }
  });

  it('treats submitting the current tag as a no-op that does not start the cooldown', async () => {
    const user = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Noop',
      role: 'employee',
    });
    const current = user.handle as string;

    const result = await updateIdentity(
      { id: user.id, role: 'employee' },
      { handle: current },
    );

    expect(result.ok).toBe(true);
    const rows = await query<{ handle: string; handle_changed_at: Date | null }>(
      `SELECT handle, handle_changed_at FROM users WHERE id = $1`,
      [user.id],
    );
    expect(rows[0]?.handle).toBe(current);
    expect(rows[0]?.handle_changed_at).toBeNull();
  });

  it('rejects a tag already taken by another account without changing it', async () => {
    const owner = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Owner',
      role: 'employee',
    });
    const other = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Other',
      role: 'employee',
    });
    const taken = owner.handle as string;

    const result = await updateIdentity({ id: other.id, role: 'employee' }, { handle: taken });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CONFLICT');
    }
    const rows = await query<{ handle: string }>(`SELECT handle FROM users WHERE id = $1`, [
      other.id,
    ]);
    expect(rows[0]?.handle).toBe(other.handle);
  });

  it('rejects invalid and reserved tags at the service boundary', async () => {
    const user = await insertUser({
      email: `${randomUUID()}@example.com`,
      name: 'Valid',
      role: 'employee',
    });
    const actor = { id: user.id, role: 'employee' as const };

    for (const input of [{}, { handle: 'Admin' }, { handle: 'admin' }, { name: '' }]) {
      const result = await updateIdentity(actor, input);
      expect(result.ok, JSON.stringify(input)).toBe(false);
    }
  });
});
