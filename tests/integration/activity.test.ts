import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';
import { listFeed, pruneStaleActivityEvents, recordEvent } from '@/modules/activity';
import { insertUser } from '@/modules/auth/repository';
import { acceptFriendship, removeFriend } from '@/modules/friendships';
import {
  createGroup,
  dissolveGroup,
  joinGroup,
  leaveGroup,
  removeGroupMember,
} from '@/modules/groups';
import { deleteGroupActivity } from '@/modules/groups/repository';
import { saveWatchedRecord } from '@/modules/records';

import { installTmdbFetch } from './tmdb-stub';

beforeAll(() => {
  installTmdbFetch((ref) => ({ title: ref === '27205' ? 'Начало' : `media-${ref}`, year: 2010 }));
});

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

async function countEvents(actorId: number): Promise<number> {
  const rows = await query<{ count: number }>(
    'SELECT count(*)::int AS count FROM activity_events WHERE actor_id = $1',
    [actorId],
  );
  return Number(rows[0]?.count ?? 0);
}

async function makeMedia(externalRef: string): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO media (kind, external_ref, title) VALUES (0, $1, $2) RETURNING id`,
    [externalRef, `media-${externalRef}`],
  );
  return rows[0]!.id;
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
        kind: 'friendship_accepted',
      }),
    );

    const payload = await Promise.race([
      received,
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('notification timeout')), 5_000),
      ),
    ]);
    expect(Number(payload)).toBe(event.id);

    await listener.end();
  });

  it('does not persist an event when the enclosing transaction rolls back', async () => {
    const actor = await makeUser(`rollback-${randomUUID().slice(0, 8)}`);
    await expect(
      withTransaction(async (tx) => {
        await recordEvent(tx, {
          actorId: actor.id,
          kind: 'friendship_accepted',
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
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 1)`,
      [viewer.id, friend.id],
    );

    const openGroup = await query<{ id: number }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      [`open-${randomUUID().slice(0, 8)}`],
    );
    const restrictedGroup = await query<{ id: number }>(
      `INSERT INTO groups (name, restricted) VALUES ($1, true) RETURNING id`,
      [`closed-${randomUUID().slice(0, 8)}`],
    );
    await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, [
      openGroup[0]!.id,
      viewer.id,
    ]);

    const event = (actorId: number) =>
      withTransaction((tx) =>
        recordEvent(tx, {
          actorId,
          kind: 'friendship_accepted',
        }),
      );

    const friendEvent = await event(friend.id);
    const strangerEvent = await event(stranger.id);
    const hiddenEvent = await event(hidden.id);
    const groupEvent = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: friend.id,
        kind: 'group_joined',
        groupId: openGroup[0]!.id,
      }),
    );
    const restrictedEvent = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: stranger.id,
        kind: 'group_joined',
        groupId: restrictedGroup[0]!.id,
      }),
    );
    const ownEvent = await event(viewer.id);

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

  it('derives the rating value and title by joining the stored rating and media', async () => {
    const viewer = await makeUser(`derive-${randomUUID().slice(0, 8)}`);
    const ref = `derive-${randomUUID().slice(0, 8)}`;
    const mediaId = await makeMedia(ref);
    await query(
      `INSERT INTO ratings (user_id, media_id, group_id, rating) VALUES ($1, $2, NULL, 85)`,
      [viewer.id, mediaId],
    );
    await withTransaction((tx) =>
      recordEvent(tx, { actorId: viewer.id, kind: 'film_rated', mediaId }),
    );

    const result = await listFeed({ id: viewer.id, role: 'employee' }, { limit: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const item = result.value.items[0];
    expect(item?.rating).toBe(8.5);
    expect(item?.title).toBe(`media-${ref}`);
    expect(item?.href).toBe(`/film/${ref}`);
    expect(item?.mediaId).toBe(mediaId);
  });

  it('pages without repeating entries and orders newest first', async () => {
    const viewer = await makeUser(`pager-${randomUUID().slice(0, 8)}`);
    const created: number[] = [];
    for (let index = 0; index < 4; index += 1) {
      const event = await withTransaction((tx) =>
        recordEvent(tx, {
          actorId: viewer.id,
          kind: 'friendship_accepted',
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

describe('feed retention', () => {
  it('keeps recent events, hides stale ones and removes them', async () => {
    const actor = await makeUser(`retain-${randomUUID().slice(0, 8)}`);
    const stale = await withTransaction((tx) =>
      recordEvent(tx, { actorId: actor.id, kind: 'friendship_accepted' }),
    );
    await query(
      `UPDATE activity_events SET created_at = now() - interval '2 days' WHERE id = $1`,
      [stale.id],
    );
    const fresh = await withTransaction((tx) =>
      recordEvent(tx, { actorId: actor.id, kind: 'friendship_accepted' }),
    );

    const hidden = await listFeed({ id: actor.id, role: 'employee' }, { limit: 50 });
    expect(hidden.ok).toBe(true);
    if (!hidden.ok) return;
    const visibleIds = hidden.value.items.map((item) => item.id);
    expect(visibleIds).toContain(fresh.id);
    expect(visibleIds).not.toContain(stale.id);

    expect(await pruneStaleActivityEvents()).toBeGreaterThanOrEqual(1);

    const remaining = await query<{ id: number }>(
      'SELECT id FROM activity_events WHERE id = ANY($1::bigint[])',
      [[stale.id, fresh.id]],
    );
    const remainingIds = remaining.map((row) => row.id);
    expect(remainingIds).not.toContain(stale.id);
    expect(remainingIds).toContain(fresh.id);
  });
});

describe('real write paths', () => {
  it('writes a personal rating and its event in one transaction', async () => {
    const actor = await makeUser(`rater-${randomUUID().slice(0, 8)}`);
    const result = await saveWatchedRecord(actor, {
      mediaKind: 'film',
      mediaRef: '27205',
      rating: 9,
      watchedAt: '2026-08-12',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ratings = await query<{ count: number }>(
      'SELECT count(*)::int AS count FROM ratings WHERE user_id = $1 AND group_id IS NULL',
      [actor.id],
    );
    expect(Number(ratings[0]?.count)).toBe(1);
    expect(await countEvents(actor.id)).toBe(1);
  });

  it('records no event when the rating write fails', async () => {
    const missingActor: Actor = { id: 9_999_999_999, role: 'employee' };
    await expect(
      saveWatchedRecord(missingActor, {
        mediaKind: 'film',
        mediaRef: '1',
        rating: 5,
        watchedAt: '2026-08-12',
      }),
    ).rejects.toThrow();
    expect(await countEvents(missingActor.id)).toBe(0);
  });

  it('accepts a friendship and records the acceptance event', async () => {
    const requester = await makeUser(`req-${randomUUID().slice(0, 8)}`);
    const addressee = await makeUser(`addr-${randomUUID().slice(0, 8)}`);
    const rows = await query<{ id: number }>(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 0) RETURNING id`,
      [requester.id, addressee.id],
    );

    const result = await acceptFriendship(addressee, { friendshipId: rows[0]!.id });
    expect(result.ok).toBe(true);

    const status = await query<{ status: number }>(
      'SELECT status FROM friendships WHERE id = $1',
      [rows[0]!.id],
    );
    expect(status[0]?.status).toBe(1);
    expect(await countEvents(addressee.id)).toBe(1);
  });

  it('joins an open group and refuses a restricted one', async () => {
    const actor = await makeUser(`joiner-${randomUUID().slice(0, 8)}`);
    const open = await query<{ id: number }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      [`join-open-${randomUUID().slice(0, 8)}`],
    );
    const closed = await query<{ id: number }>(
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

const FRIEND_REMOVED = 6;
const GROUP_LEFT = 7;
const GROUP_REMOVED = 8;
const GROUP_DISSOLVED = 9;

async function signalsFor(userIds: number[]): Promise<
  { kind: number; target_user_id: number | null; group_id: number | null }[]
> {
  return query(
    `SELECT kind, target_user_id, group_id FROM activity_events
      WHERE target_user_id = ANY($1::bigint[]) ORDER BY id`,
    [userIds],
  );
}

describe('invalidation signals', () => {
  it('records one friend_removed signal per user when an accepted friendship is removed', async () => {
    const one = await makeUser(`sig-a-${randomUUID().slice(0, 8)}`);
    const two = await makeUser(`sig-b-${randomUUID().slice(0, 8)}`);
    const rows = await query<{ id: number }>(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 1) RETURNING id`,
      [one.id, two.id],
    );

    const result = await removeFriend(one, { friendshipId: rows[0]!.id });
    expect(result.ok).toBe(true);

    const signals = (await signalsFor([one.id, two.id])).filter(
      (row) => row.kind === FRIEND_REMOVED,
    );
    expect(signals.map((row) => row.target_user_id).sort()).toEqual([one.id, two.id].sort());
  });

  it('records no signal when the friendship removal fails', async () => {
    const one = await makeUser(`sig-fa-${randomUUID().slice(0, 8)}`);
    const two = await makeUser(`sig-fb-${randomUUID().slice(0, 8)}`);
    const rows = await query<{ id: number }>(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 0) RETURNING id`,
      [one.id, two.id],
    );

    const result = await removeFriend(one, { friendshipId: rows[0]!.id });
    expect(result.ok).toBe(false);

    const signals = (await signalsFor([one.id, two.id])).filter(
      (row) => row.kind === FRIEND_REMOVED,
    );
    expect(signals).toHaveLength(0);
  });

  it('records group_left, group_removed and one group_dissolved per member', async () => {
    const admin = await makeUser(`sig-admin-${randomUUID().slice(0, 8)}`);
    const leaving = await makeUser(`sig-leave-${randomUUID().slice(0, 8)}`);
    const removed = await makeUser(`sig-removed-${randomUUID().slice(0, 8)}`);
    const staying = await makeUser(`sig-stay-${randomUUID().slice(0, 8)}`);

    const created = await createGroup(admin, {
      name: `signals-${randomUUID().slice(0, 8)}`,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const groupId = created.value.id;

    for (const actor of [leaving, removed, staying]) {
      const joined = await joinGroup(actor, { groupId });
      expect(joined.ok).toBe(true);
    }

    const left = await leaveGroup(leaving, { groupId });
    expect(left.ok).toBe(true);
    const leftSignals = (await signalsFor([leaving.id])).filter(
      (row) => row.kind === GROUP_LEFT,
    );
    expect(leftSignals).toHaveLength(1);
    expect(leftSignals[0]!.target_user_id).toBe(leaving.id);
    expect(leftSignals[0]!.group_id).toBeNull();

    const dropped = await removeGroupMember(admin, { groupId, userId: removed.id });
    expect(dropped.ok).toBe(true);
    const removedSignals = (await signalsFor([removed.id])).filter(
      (row) => row.kind === GROUP_REMOVED,
    );
    expect(removedSignals).toHaveLength(1);
    expect(removedSignals[0]!.target_user_id).toBe(removed.id);
    expect(removedSignals[0]!.group_id).toBeNull();

    const dissolved = await dissolveGroup(admin, { groupId });
    expect(dissolved.ok).toBe(true);
    const dissolvedSignals = (await signalsFor([admin.id, staying.id])).filter(
      (row) => row.kind === GROUP_DISSOLVED,
    );
    expect(dissolvedSignals.map((row) => row.target_user_id).sort()).toEqual(
      [admin.id, staying.id].sort(),
    );
    for (const row of dissolvedSignals) {
      expect(row.group_id).toBeNull();
    }
  });

  it('keeps signals with a NULL group through the group-deletion cleanup', async () => {
    const admin = await makeUser(`sig-keep-${randomUUID().slice(0, 8)}`);
    const created = await createGroup(admin, {
      name: `keep-${randomUUID().slice(0, 8)}`,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const groupId = created.value.id;

    const signal = await withTransaction(async (tx) => {
      const inserted = await recordEvent(tx, {
        actorId: admin.id,
        kind: 'group_dissolved',
        targetUserId: admin.id,
      });
      await recordEvent(tx, { actorId: admin.id, kind: 'group_joined', groupId });
      await deleteGroupActivity(tx, groupId);
      return inserted;
    });

    const signals = await signalsFor([admin.id]);
    expect(signals.map((row) => row.kind)).toContain(GROUP_DISSOLVED);
    const leftovers = await query<{ id: number }>(
      'SELECT id FROM activity_events WHERE group_id = $1',
      [groupId],
    );
    expect(leftovers).toHaveLength(0);

    const feed = await listFeed({ id: admin.id, role: 'employee' }, { limit: 50 });
    expect(feed.ok).toBe(true);
    if (!feed.ok) return;
    expect(feed.value.items.map((item) => item.id)).not.toContain(signal.id);
  });

  it('never lists invalidation signals in the feed', async () => {
    const viewer = await makeUser(`sig-feed-${randomUUID().slice(0, 8)}`);
    const signal = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: viewer.id,
        kind: 'friend_removed',
        targetUserId: viewer.id,
      }),
    );

    const result = await listFeed({ id: viewer.id, role: 'employee' }, { limit: 50 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items.map((item) => item.id)).not.toContain(signal.id);
  });
});
