import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { Client } from 'pg';
import { afterAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';
import { listFeed, recordEvent } from '@/modules/activity';
import { insertUser } from '@/modules/auth/repository';
import { acceptFriendship } from '@/modules/friendships';
import { joinGroup } from '@/modules/groups';
import { saveWatchedRecord } from '@/modules/records';

const { databaseUrl } = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/integration/.db-url.json'), 'utf8'),
) as { databaseUrl: string };

async function makeUser(handle: string, profileHidden = false): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: handle,
    role: 'employee',
  });
  await query('UPDATE users SET handle = $2, profile_hidden = $3 WHERE id = $1', [
    row.id,
    handle,
    profileHidden,
  ]);
  return { id: row.id, role: 'employee' };
}

async function countEvents(actorId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    'SELECT count(*)::text AS count FROM activity_events WHERE actor_id = $1',
    [actorId],
  );
  return Number(rows[0]?.count ?? '0');
}

afterAll(async () => {
  await closePool();
});

describe('activity events migration and notification', () => {
  it('observes a pg_notify when an event row is committed', async () => {
    const actor = await makeUser(`notify-${randomUUID().slice(0, 8)}`);
    const listener = new Client({ connectionString: databaseUrl });
    await listener.connect();
    await listener.query('LISTEN activity_events');

    const received = new Promise<string>((resolveNotification) => {
      listener.on('notification', (message) => {
        resolveNotification(message.payload ?? '');
      });
    });

    const event = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: actor.id,
        kind: 'film_rated',
        targetType: 'film',
        targetId: '27205',
        payload: { title: 'Начало', rating: 9 },
      }),
    );

    const payload = await Promise.race([
      received,
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('notification timeout')), 5_000),
      ),
    ]);
    expect(payload).toBe(event.id);

    await listener.end();
  });

  it('does not persist an event when the enclosing transaction rolls back', async () => {
    const actor = await makeUser(`rollback-${randomUUID().slice(0, 8)}`);
    await expect(
      withTransaction(async (tx) => {
        await recordEvent(tx, {
          actorId: actor.id,
          kind: 'film_rated',
          targetType: 'film',
          targetId: '603',
          payload: { title: 'Матрица', rating: 8 },
        });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(await countEvents(actor.id)).toBe(0);
  });
});

describe('activity feed visibility and pagination', () => {
  it('shows friends, memberships and own events while hiding strangers, hidden profiles and restricted groups', async () => {
    const viewer = await makeUser(`viewer-${randomUUID().slice(0, 8)}`);
    const friend = await makeUser(`friend-${randomUUID().slice(0, 8)}`);
    const stranger = await makeUser(`stranger-${randomUUID().slice(0, 8)}`);
    const hidden = await makeUser(`hidden-${randomUUID().slice(0, 8)}`, true);

    await query(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'accepted')`,
      [viewer.id, friend.id],
    );

    const openGroup = await query<{ id: string }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      [`open-${randomUUID().slice(0, 8)}`],
    );
    const restrictedGroup = await query<{ id: string }>(
      `INSERT INTO groups (name, restricted) VALUES ($1, true) RETURNING id`,
      [`closed-${randomUUID().slice(0, 8)}`],
    );
    await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, [
      openGroup[0]!.id,
      viewer.id,
    ]);

    const event = (actorId: string, title: string) =>
      withTransaction((tx) =>
        recordEvent(tx, {
          actorId,
          kind: 'film_rated',
          targetType: 'film',
          targetId: '1',
          payload: { title, rating: 5 },
        }),
      );

    const friendEvent = await event(friend.id, 'friend-event');
    const strangerEvent = await event(stranger.id, 'stranger-event');
    const hiddenEvent = await event(hidden.id, 'hidden-event');
    const groupEvent = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: friend.id,
        kind: 'group_joined',
        groupId: openGroup[0]!.id,
        targetType: 'group',
        targetId: openGroup[0]!.id,
      }),
    );
    const restrictedEvent = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: stranger.id,
        kind: 'group_joined',
        groupId: restrictedGroup[0]!.id,
        targetType: 'group',
        targetId: restrictedGroup[0]!.id,
      }),
    );
    const ownEvent = await event(viewer.id, 'own-event');

    const result = await listFeed({ id: viewer.id, role: 'employee' }, { limit: 50 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.value.items.map((item) => item.id);
    expect(ids).toContain(friendEvent.id);
    expect(ids).toContain(groupEvent.id);
    expect(ids).toContain(ownEvent.id);
    expect(ids).not.toContain(strangerEvent.id);
    expect(ids).not.toContain(hiddenEvent.id);
    expect(ids).not.toContain(restrictedEvent.id);
  });

  it('pages without repeating entries and orders newest first', async () => {
    const viewer = await makeUser(`pager-${randomUUID().slice(0, 8)}`);
    const created: string[] = [];
    for (let index = 0; index < 4; index += 1) {
      const event = await withTransaction((tx) =>
        recordEvent(tx, {
          actorId: viewer.id,
          kind: 'film_rated',
          targetType: 'film',
          targetId: String(index),
          payload: { title: `paged-${index}`, rating: 5 },
        }),
      );
      created.push(event.id);
    }

    const first = await listFeed({ id: viewer.id, role: 'employee' }, { limit: 2 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.items).toHaveLength(2);
    expect(first.value.nextCursor).not.toBeNull();

    const second = await listFeed({ id: viewer.id, role: 'employee' }, {
      limit: 2,
      cursor: first.value.nextCursor ?? undefined,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const firstIds = first.value.items.map((item) => item.id);
    const secondIds = second.value.items.map((item) => item.id);
    expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);

    const times = [...first.value.items, ...second.value.items].map((item) => item.createdAt);
    expect(times).toEqual([...times].sort((a, b) => b.localeCompare(a)));
  });
});

describe('real write paths', () => {
  it('writes a watched record and its event in one transaction', async () => {
    const actor = await makeUser(`rater-${randomUUID().slice(0, 8)}`);
    const result = await saveWatchedRecord(actor, {
      mediaKind: 'film',
      mediaRef: '27205',
      title: 'Начало',
      year: 2010,
      genres: ['фантастика'],
      rating: 9,
      watchedAt: '2026-08-12',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const records = await query<{ count: string }>(
      'SELECT count(*)::text AS count FROM watched_records WHERE user_id = $1',
      [actor.id],
    );
    expect(Number(records[0]?.count)).toBe(1);
    expect(await countEvents(actor.id)).toBe(1);
  });

  it('records no event when the record write fails', async () => {
    const missingActor: Actor = { id: randomUUID(), role: 'employee' };
    await expect(
      saveWatchedRecord(missingActor, {
        mediaKind: 'film',
        mediaRef: '1',
        title: 'Broken',
        rating: 5,
        watchedAt: '2026-08-12',
      }),
    ).rejects.toThrow();
    expect(await countEvents(missingActor.id)).toBe(0);
  });

  it('accepts a friendship and records the acceptance event', async () => {
    const requester = await makeUser(`req-${randomUUID().slice(0, 8)}`);
    const addressee = await makeUser(`addr-${randomUUID().slice(0, 8)}`);
    const rows = await query<{ id: string }>(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending') RETURNING id`,
      [requester.id, addressee.id],
    );

    const result = await acceptFriendship(addressee, { friendshipId: rows[0]!.id });
    expect(result.ok).toBe(true);

    const status = await query<{ status: string }>(
      'SELECT status FROM friendships WHERE id = $1',
      [rows[0]!.id],
    );
    expect(status[0]?.status).toBe('accepted');
    expect(await countEvents(addressee.id)).toBe(1);
  });

  it('joins an open group and refuses a restricted one', async () => {
    const actor = await makeUser(`joiner-${randomUUID().slice(0, 8)}`);
    const open = await query<{ id: string }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      [`join-open-${randomUUID().slice(0, 8)}`],
    );
    const closed = await query<{ id: string }>(
      `INSERT INTO groups (name, restricted) VALUES ($1, true) RETURNING id`,
      [`join-closed-${randomUUID().slice(0, 8)}`],
    );

    const joined = await joinGroup(actor, { groupId: open[0]!.id });
    expect(joined.ok).toBe(true);
    expect(await countEvents(actor.id)).toBe(1);

    const refused = await joinGroup(actor, { groupId: closed[0]!.id });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.code).toBe('FORBIDDEN');
    }
  });
});
