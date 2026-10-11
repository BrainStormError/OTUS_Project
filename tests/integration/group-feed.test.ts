import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { getVisibleEvent, listGroupFeed } from '@/modules/activity';
import { insertUser } from '@/modules/auth/repository';
import { addComment, attachDiscussion, createDiscussion } from '@/modules/discussions';
import { joinGroup, saveGroupRating } from '@/modules/groups';

import { installTmdbFetch } from './tmdb-stub';

beforeAll(() => {
  installTmdbFetch((ref) => ({ title: `film-${ref}`, year: 2010 }));
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

async function rate(actor: Actor, groupId: number, mediaRef: string, value: number) {
  return saveGroupRating(actor, {
    groupId,
    mediaKind: 'film',
    mediaRef,
    rating: value,
    watchedAt: '2026-08-12',
  });
}

afterAll(async () => {
  await closePool();
});

describe('listGroupFeed', () => {
  it('is only available to group members', async () => {
    const admin = await makeUser('admin');
    const stranger = await makeUser('stranger');
    const groupId = await makeGroup(admin);
    const result = await listGroupFeed(stranger, groupId, { limit: 20 });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('lists the group event kinds newest first', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const joiner = await makeUser('joiner');
    const groupId = await makeGroup(admin, [member]);

    await rate(admin, groupId, '27205', 7);
    await rate(member, groupId, '27205', 8);
    const discussion = await createDiscussion(admin, { groupId, title: 'Тема' });
    if (!discussion.ok) return;
    await addComment(member, { discussionId: discussion.value.id, body: 'Комментарий' });
    await joinGroup(joiner, { groupId });

    const result = await listGroupFeed(member, groupId, { limit: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const kinds = result.value.items.map((item) => item.kind);
    expect(kinds).toContain('group_joined');
    expect(kinds).toContain('post_created');
    expect(kinds).not.toContain('comment_created');
    expect(kinds).toContain('film_rated');
    expect(result.value.items.every((item) => item.groupId === groupId)).toBe(true);

    const ratingItem = result.value.items.find((item) => item.kind === 'film_rated');
    expect(ratingItem?.title).toBe('film-27205');
    expect(ratingItem?.rating).toBe(8);
  });

  it('hides recorded comment events from the feed and the stream', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);
    const created = await createDiscussion(admin, { groupId, title: 'Тема' });
    if (!created.ok) return;
    const inserted = await query<{ id: number }>(
      `INSERT INTO activity_events (actor_id, kind, group_id, discussion_id)
       VALUES ($1, 5, $2, $3) RETURNING id`,
      [member.id, groupId, created.value.id],
    );
    const eventId = inserted[0]!.id;

    const feed = await listGroupFeed(member, groupId, { limit: 20 });
    expect(feed.ok).toBe(true);
    if (!feed.ok) return;
    expect(feed.value.items.some((item) => item.kind === 'comment_created')).toBe(false);
    expect(feed.value.items.some((item) => item.id === eventId)).toBe(false);

    expect(await getVisibleEvent(member.id, eventId)).toBeNull();
  });

  it('pages without repeating entries', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    for (const ref of ['1', '2', '3']) {
      await rate(admin, groupId, ref, 5);
    }

    const first = await listGroupFeed(admin, groupId, { limit: 2 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.items).toHaveLength(2);
    expect(first.value.nextCursor).not.toBeNull();

    const second = await listGroupFeed(admin, groupId, {
      limit: 2,
      cursor: first.value.nextCursor ?? undefined,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const firstIds = first.value.items.map((item) => item.id);
    expect(second.value.items.some((item) => firstIds.includes(item.id))).toBe(false);
  });

  it('exposes a discussion attached after the rating event', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);
    await rate(admin, groupId, '603', 8);
    const rated = await rate(member, groupId, '603', 9);
    expect(rated.ok).toBe(true);
    if (!rated.ok) return;

    const before = await listGroupFeed(member, groupId, { limit: 20 });
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    const beforeItem = before.value.items.find((item) => item.mediaId === rated.value.mediaId);
    expect(beforeItem?.discussionId).toBeNull();

    const attached = await attachDiscussion(admin, {
      groupId,
      mediaId: rated.value.mediaId,
      title: 'Обсуждаем Матрицу',
    });
    expect(attached.ok).toBe(true);
    if (!attached.ok) return;

    const after = await listGroupFeed(member, groupId, { limit: 20 });
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    const afterItem = after.value.items.find(
      (item) => item.kind === 'film_rated' && item.mediaId === rated.value.mediaId,
    );
    expect(afterItem?.discussionId).toBe(attached.value.id);
  });
});
