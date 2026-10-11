import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import {
  addComment,
  createDiscussion,
  getDiscussion,
  listDiscussions,
} from '@/modules/discussions';
import { saveGroupRating } from '@/modules/groups';

import { installTmdbFetch } from './tmdb-stub';

beforeAll(() => {
  installTmdbFetch((ref) => ({ title: ref === '27205' ? 'Начало' : `media-${ref}`, year: 2010 }));
});

async function makeUser(prefix: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `${prefix}-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

async function makeGroup(actor: Actor, role: 'admin' | 'member'): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
    [`group-${randomUUID().slice(0, 8)}`],
  );
  const groupId = rows[0]!.id;
  await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`, [
    groupId,
    actor.id,
    role === 'admin' ? 1 : 0,
  ]);
  return groupId;
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

describe('createDiscussion', () => {
  it('lets an admin create a topic and lists topics newest first', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin, 'admin');

    const first = await createDiscussion(admin, { groupId, title: 'Первая тема' });
    const second = await createDiscussion(admin, { groupId, title: 'Вторая тема' });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const list = await listDiscussions(admin, groupId);
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.value.map((item) => item.title)).toEqual(['Вторая тема', 'Первая тема']);
    expect(list.value[0]?.commentCount).toBe(0);
    expect(list.value[0]?.authorName).not.toBeNull();
    expect(typeof list.value[0]?.id).toBe('number');
  });

  it('rejects a non-admin member and a non-member', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const stranger = await makeUser('stranger');
    const groupId = await makeGroup(admin, 'admin');
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 0)`, [
      groupId,
      member.id,
    ]);

    expect(await createDiscussion(member, { groupId, title: 'Тема' })).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
    expect(await createDiscussion(stranger, { groupId, title: 'Тема' })).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });

  it('records a post_created event inside the same transaction', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin, 'admin');
    await createDiscussion(admin, { groupId, title: 'Тема с событием' });
    expect(await countGroupEvents(groupId, 4)).toBe(1);
  });
});

describe('media-attached discussions', () => {
  it('rejects a second discussion for the same media via the partial unique index', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin, 'admin');

    const rated = await saveGroupRating(admin, {
      groupId,
      mediaKind: 'film',
      mediaRef: '27205',
      rating: 8,
      watchedAt: '2026-08-12',
    });
    expect(rated.ok).toBe(true);
    if (!rated.ok) return;

    const first = await createDiscussion(admin, {
      groupId,
      title: 'Обсуждаем Начало',
      mediaId: rated.value.mediaId,
    });
    expect(first.ok).toBe(true);

    const second = await createDiscussion(admin, {
      groupId,
      title: 'Ещё одно обсуждение',
      mediaId: rated.value.mediaId,
    });
    expect(second).toMatchObject({ ok: false, code: 'CONFLICT' });
  });

  it('rejects attaching a discussion to unrated media', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin, 'admin');
    const result = await createDiscussion(admin, {
      groupId,
      title: 'Обсуждаем',
      mediaId: 999999,
    });
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION' });
  });
});

describe('addComment', () => {
  it('stores member comments in chronological order and rejects non-members', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const stranger = await makeUser('stranger');
    const groupId = await makeGroup(admin, 'admin');
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 0)`, [
      groupId,
      member.id,
    ]);

    const created = await createDiscussion(admin, { groupId, title: 'Тема' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const firstComment = await addComment(member, { discussionId: created.value.id, body: 'Первый' });
    const secondComment = await addComment(admin, { discussionId: created.value.id, body: 'Второй' });
    expect(firstComment.ok).toBe(true);
    expect(secondComment.ok).toBe(true);

    const detail = await getDiscussion(member, created.value.id, groupId);
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.posts.map((post) => post.body)).toEqual(['Первый', 'Второй']);
    expect(detail.value.commentCount).toBe(2);

    const rejected = await addComment(stranger, {
      discussionId: created.value.id,
      body: 'Нельзя',
    });
    expect(rejected).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('records no event for a comment', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin, 'admin');
    const created = await createDiscussion(admin, { groupId, title: 'Тема' });
    if (!created.ok) return;
    await addComment(admin, { discussionId: created.value.id, body: 'Комментарий' });
    expect(await countGroupEvents(groupId, 5)).toBe(0);
  });
});
