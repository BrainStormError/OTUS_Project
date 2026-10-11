import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { resolveActor } from '@/modules/auth/actor';
import { authorizeDemoUser } from '@/modules/auth/demo';
import { insertUser, updatePrivacy } from '@/modules/auth/repository';
import { getOwnProfile, getProfileByHandle } from '@/modules/profiles';
import { saveWatchedRecord } from '@/modules/records';

import { installTmdbFetch } from './tmdb-stub';

async function makeUser(prefix: string, handle?: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `${prefix}-${randomUUID().slice(0, 6)}`,
    handle,
    role: 'employee',
  });
  return { id: row.id, role: 'employee', name: row.name, handle: row.handle };
}

async function addRating(actor: Actor, value: number): Promise<void> {
  await saveWatchedRecord(actor, {
    mediaKind: 'film',
    mediaRef: '27205',
    rating: value,
    watchedAt: '2026-08-12',
  });
}

beforeAll(() => {
  installTmdbFetch(() => ({ title: 'Начало', year: 2010 }));
});

afterAll(async () => {
  await closePool();
});

describe('account handle', () => {
  it('exposes a non-null handle through the actor for a newly created account', async () => {
    const email = `${randomUUID()}@demo.local`;
    const signedIn = await authorizeDemoUser({ email, name: 'Demo' });
    expect(signedIn?.id).toBeTruthy();

    const actor = await resolveActor(Number(signedIn!.id));
    expect(actor?.handle).toBeTruthy();
    expect(typeof actor?.handle).toBe('string');
  });

  it('gives inserted users a distinct handle derived from the email', async () => {
    const first = await insertUser({
      email: `alpha-${randomUUID()}@example.com`,
      name: 'Alpha',
      role: 'employee',
    });
    const second = await insertUser({
      email: `beta-${randomUUID()}@example.com`,
      name: 'Beta',
      role: 'employee',
    });
    expect(first.handle).toBeTruthy();
    expect(second.handle).toBeTruthy();
    expect(first.handle).not.toBe(second.handle);
  });
});

describe('profile read', () => {
  it('returns the owner identity with statistics and recent records from stored ratings', async () => {
    const owner = await makeUser('owner');
    await addRating(owner, 8.4);
    await addRating(owner, 9);

    const result = await getOwnProfile(owner);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.isOwn).toBe(true);
    expect(result.value.stats.count).toBe(1);
    expect(result.value.recent).toHaveLength(1);
    expect(result.value.recent[0]?.title).toBe('Начало');
  });

  it('resolves another user by handle and reports unknown handles as not found', async () => {
    const owner = await makeUser('owner', `target-${randomUUID().slice(0, 8)}`);
    await addRating(owner, 7);

    const found = await getProfileByHandle({ id: owner.id + 100000, role: 'employee' }, owner.handle!);
    expect(found.ok).toBe(true);
    if (found.ok) {
      expect(found.value.identity.id).toBe(owner.id);
      expect(found.value.isOwn).toBe(false);
    }

    const missing = await getProfileByHandle(null, 'no-such-handle');
    expect(missing).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });

  it('lists only the last week in recent while statistics count older records', async () => {
    const owner = await makeUser('owner');
    await addRating(owner, 8);
    await saveWatchedRecord(owner, {
      mediaKind: 'film',
      mediaRef: '603',
      rating: 7,
      watchedAt: '2026-08-12',
    });

    const rows = await query<{ id: number }>(
      `SELECT r.id
         FROM ratings r
         JOIN media m ON m.id = r.media_id
        WHERE r.user_id = $1 AND m.external_ref = $2 AND r.group_id IS NULL`,
      [owner.id, '603'],
    );
    await query(`UPDATE ratings SET created_at = now() - interval '10 days' WHERE id = $1`, [
      rows[0]!.id,
    ]);

    const result = await getOwnProfile(owner);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stats.count).toBe(2);
    expect(result.value.recent).toHaveLength(1);
    expect(result.value.recent[0]?.mediaRef).toBe('27205');
  });

  it('hides statistics and recent records from non-owners when stats are hidden', async () => {
    const owner = await makeUser('owner', `private-${randomUUID().slice(0, 8)}`);
    await addRating(owner, 9);
    await updatePrivacy(owner.id, { statsHidden: true });

    const asStranger = await getProfileByHandle({ id: owner.id + 100000, role: 'employee' }, owner.handle!);
    expect(asStranger.ok).toBe(true);
    if (asStranger.ok) {
      expect(asStranger.value.statsRestricted).toBe(true);
      expect(asStranger.value.stats.count).toBe(0);
      expect(asStranger.value.recent).toHaveLength(0);
    }

    const asOwner = await getOwnProfile(owner);
    expect(asOwner.ok).toBe(true);
    if (asOwner.ok) {
      expect(asOwner.value.statsRestricted).toBe(false);
      expect(asOwner.value.stats.count).toBe(1);
    }
  });
});
