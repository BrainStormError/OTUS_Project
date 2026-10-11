import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import { attachDiscussion } from '@/modules/discussions';
import { listGroupRatings, saveGroupRating } from '@/modules/groups';

import { installTmdbFetch } from './tmdb-stub';

beforeAll(() => {
  installTmdbFetch(() => ({ title: 'Начало', year: 2010 }));
});

async function makeUser(prefix: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `${prefix}-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

async function makeGroup(admin: Actor, members: Actor[] = []): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
    [`group-${randomUUID().slice(0, 8)}`],
  );
  const groupId = rows[0]!.id;
  await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 1)`, [
    groupId,
    admin.id,
  ]);
  for (const member of members) {
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 0)`, [
      groupId,
      member.id,
    ]);
  }
  return groupId;
}

function rating(groupId: number, value: number) {
  return {
    groupId,
    mediaKind: 'film' as const,
    mediaRef: '27205',
    rating: value,
    watchedAt: '2026-08-12',
  };
}

async function countGroupEvents(groupId: number, kindCode: number): Promise<number> {
  const rows = await query<{ count: number }>(
    `SELECT count(*)::int AS count FROM activity_events WHERE group_id = $1 AND kind = $2`,
    [groupId, kindCode],
  );
  return Number(rows[0]?.count ?? 0);
}

afterAll(async () => {
  await closePool();
});

describe('saveGroupRating', () => {
  it('persists a rating for a member and records a group event', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const result = await saveGroupRating(admin, rating(groupId, 8.4));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(typeof result.value.mediaId).toBe('number');

    const rows = await query<{ count: number; rating: number }>(
      `SELECT count(*)::int AS count, max(rating) AS rating FROM ratings WHERE group_id = $1`,
      [groupId],
    );
    expect(Number(rows[0]?.count)).toBe(1);
    expect(Number(rows[0]?.rating)).toBe(84);
    expect(await countGroupEvents(groupId, 0)).toBe(1);
  });

  it('rejects a non-member', async () => {
    const admin = await makeUser('admin');
    const stranger = await makeUser('stranger');
    const groupId = await makeGroup(admin);
    const result = await saveGroupRating(stranger, rating(groupId, 8));
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('updates an existing rating instead of duplicating it', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    await saveGroupRating(admin, rating(groupId, 8));
    await saveGroupRating(admin, rating(groupId, 9));

    const rows = await query<{ count: number; rating: number }>(
      `SELECT count(*)::int AS count, max(rating) AS rating FROM ratings WHERE group_id = $1`,
      [groupId],
    );
    expect(Number(rows[0]?.count)).toBe(1);
    expect(Number(rows[0]?.rating)).toBe(90);
  });
});

describe('listGroupRatings', () => {
  it('computes the group average as the members average', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);

    await saveGroupRating(admin, rating(groupId, 8));
    await saveGroupRating(member, rating(groupId, 9));

    const result = await listGroupRatings(admin, groupId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.average).toBe(8.5);
    expect(result.value[0]?.ratings).toHaveLength(2);
    expect(result.value[0]?.mediaKind).toBe('film');
  });

  it('reflects a re-rating in the average', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);

    await saveGroupRating(admin, rating(groupId, 8));
    await saveGroupRating(member, rating(groupId, 9));
    await saveGroupRating(admin, rating(groupId, 10));

    const result = await listGroupRatings(admin, groupId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]?.average).toBe(9.5);
  });
});

describe('attachDiscussion', () => {
  it('links a discussion to a rated media for an admin', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const rated = await saveGroupRating(admin, rating(groupId, 8));
    if (!rated.ok) return;

    const attached = await attachDiscussion(admin, {
      groupId,
      mediaId: rated.value.mediaId,
      title: 'Обсуждаем Начало',
    });
    expect(attached.ok).toBe(true);

    const rows = await query<{ media_id: number | null }>(
      `SELECT media_id FROM group_discussions WHERE group_id = $1`,
      [groupId],
    );
    expect(rows[0]?.media_id).toBe(rated.value.mediaId);
  });

  it('rejects a second discussion for the same media', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const rated = await saveGroupRating(admin, rating(groupId, 8));
    if (!rated.ok) return;
    await attachDiscussion(admin, {
      groupId,
      mediaId: rated.value.mediaId,
      title: 'Первое',
    });
    const second = await attachDiscussion(admin, {
      groupId,
      mediaId: rated.value.mediaId,
      title: 'Второе',
    });
    expect(second).toMatchObject({ ok: false, code: 'CONFLICT' });
  });

  it('rejects attaching to unrated media', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const result = await attachDiscussion(admin, {
      groupId,
      mediaId: 999999,
      title: 'Обсуждаем',
    });
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION' });
  });

  it('rejects a non-admin attach', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);
    const rated = await saveGroupRating(admin, rating(groupId, 8));
    if (!rated.ok) return;
    const result = await attachDiscussion(member, {
      groupId,
      mediaId: rated.value.mediaId,
      title: 'Обсуждаем',
    });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});
