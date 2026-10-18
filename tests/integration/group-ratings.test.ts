import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';
import { insertUser } from '@/modules/auth/repository';
import { attachDiscussion } from '@/modules/discussions';
import { getGroup, listGroupRatings, saveGroupRating } from '@/modules/groups';
import { hasGroupRatingTx } from '@/modules/ratings/repository';
import { saveWatchedRecord } from '@/modules/records';
import { addWatchlist } from '@/modules/watchlist';

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

  it('rejects a member starting a media that has no group rating', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);
    const result = await saveGroupRating(member, rating(groupId, 8));
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const rows = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM ratings WHERE group_id = $1`,
      [groupId],
    );
    expect(Number(rows[0]?.count)).toBe(0);
  });

  it('accepts a member rating a media already started by an admin', async () => {
    const admin = await makeUser('admin');
    const member = await makeUser('member');
    const groupId = await makeGroup(admin, [member]);
    await saveGroupRating(admin, rating(groupId, 8));

    const result = await saveGroupRating(member, rating(groupId, 9));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM ratings WHERE group_id = $1`,
      [groupId],
    );
    expect(Number(rows[0]?.count)).toBe(2);
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

describe('saveGroupRating with alsoPersonal', () => {
  it('writes both rows with equal values and clears the watchlist', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const added = await addWatchlist(admin, { mediaKind: 'film', mediaRef: '27205' });
    expect(added.ok).toBe(true);

    const result = await saveGroupRating(admin, {
      ...rating(groupId, 9),
      comment: 'Отлично',
      alsoPersonal: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const mediaId = result.value.mediaId;

    const group = await query<{ rating: number; comment: string | null }>(
      `SELECT rating, comment FROM ratings WHERE group_id = $1 AND media_id = $2`,
      [groupId, mediaId],
    );
    expect(Number(group[0]?.rating)).toBe(90);
    expect(group[0]?.comment).toBe('Отлично');

    const personal = await query<{ rating: number; comment: string | null; watched_at: string }>(
      `SELECT rating, comment, watched_at::text AS watched_at FROM ratings
        WHERE user_id = $1 AND media_id = $2 AND group_id IS NULL`,
      [admin.id, mediaId],
    );
    expect(Number(personal[0]?.rating)).toBe(90);
    expect(personal[0]?.comment).toBe('Отлично');
    expect(personal[0]?.watched_at).toBe('2026-08-12');

    const watch = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM watchlist WHERE user_id = $1 AND media_id = $2`,
      [admin.id, mediaId],
    );
    expect(Number(watch[0]?.count)).toBe(0);
  });

  it('refuses to overwrite an existing personal rating and writes nothing', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const watched = await saveWatchedRecord(admin, {
      mediaKind: 'film',
      mediaRef: '27205',
      rating: 5,
      watchedAt: '2026-08-01',
    });
    expect(watched.ok).toBe(true);

    const result = await saveGroupRating(admin, {
      ...rating(groupId, 9),
      alsoPersonal: true,
    });
    expect(result).toMatchObject({ ok: false, code: 'CONFLICT' });

    const groupRows = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM ratings WHERE group_id = $1`,
      [groupId],
    );
    expect(Number(groupRows[0]?.count)).toBe(0);

    const personalRows = await query<{ count: number; rating: number }>(
      `SELECT count(*)::int AS count, max(rating) AS rating FROM ratings
        WHERE user_id = $1 AND group_id IS NULL`,
      [admin.id],
    );
    expect(Number(personalRows[0]?.count)).toBe(1);
    expect(Number(personalRows[0]?.rating)).toBe(50);
  });

  it('overwrites an existing personal rating when confirmed', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    await saveWatchedRecord(admin, {
      mediaKind: 'film',
      mediaRef: '27205',
      rating: 5,
      watchedAt: '2026-08-01',
    });

    const result = await saveGroupRating(admin, {
      ...rating(groupId, 9),
      alsoPersonal: true,
      confirmOverwrite: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const personalRows = await query<{ count: number; rating: number }>(
      `SELECT count(*)::int AS count, max(rating) AS rating FROM ratings
        WHERE user_id = $1 AND media_id = $2 AND group_id IS NULL`,
      [admin.id, result.value.mediaId],
    );
    expect(Number(personalRows[0]?.count)).toBe(1);
    expect(Number(personalRows[0]?.rating)).toBe(90);
  });

  it('leaves the personal rating intact when the group entry is deleted', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    const saved = await saveGroupRating(admin, {
      ...rating(groupId, 9),
      alsoPersonal: true,
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const mediaId = saved.value.mediaId;

    await query(`DELETE FROM ratings WHERE group_id = $1 AND media_id = $2`, [groupId, mediaId]);
    await query(`DELETE FROM groups WHERE id = $1`, [groupId]);

    const personal = await query<{ count: number; rating: number }>(
      `SELECT count(*)::int AS count, max(rating) AS rating FROM ratings
        WHERE user_id = $1 AND media_id = $2 AND group_id IS NULL`,
      [admin.id, mediaId],
    );
    expect(Number(personal[0]?.count)).toBe(1);
    expect(Number(personal[0]?.rating)).toBe(90);
  });
});

describe('hasGroupRatingTx', () => {
  it('checks group-rating existence on the transaction client', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);

    const before = await withTransaction((tx) => hasGroupRatingTx(tx, groupId, 424242));
    expect(before).toBe(false);

    const rated = await saveGroupRating(admin, rating(groupId, 8));
    if (!rated.ok) return;

    const after = await withTransaction((tx) =>
      hasGroupRatingTx(tx, groupId, rated.value.mediaId),
    );
    expect(after).toBe(true);
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

function seriesRating(groupId: number, value: number) {
  return {
    groupId,
    mediaKind: 'series' as const,
    mediaRef: '1396',
    rating: value,
    watchedAt: '2026-08-12',
  };
}

describe('group statistics', () => {
  it('aggregates the rated media into per-kind counters', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);
    await saveGroupRating(admin, rating(groupId, 8));
    await saveGroupRating(admin, seriesRating(groupId, 7));

    const group = await getGroup(admin, groupId);
    expect(group.ok).toBe(true);
    if (!group.ok) return;
    expect(group.value.stats.films).toBe(1);
    expect(group.value.stats.series).toBe(1);
  });

  it('recomputes the statistics after a new rating is saved', async () => {
    const admin = await makeUser('admin');
    const groupId = await makeGroup(admin);

    const before = await getGroup(admin, groupId);
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    expect(before.value.stats.films).toBe(0);

    await saveGroupRating(admin, rating(groupId, 8));

    const after = await getGroup(admin, groupId);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.value.stats.films).toBe(1);
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
