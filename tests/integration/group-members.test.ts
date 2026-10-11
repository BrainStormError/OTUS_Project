import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import {
  changeGroupRole,
  createGroup,
  dissolveGroup,
  getGroup,
  getGroupRole,
  getGroups,
  joinGroup,
  leaveGroup,
  removeGroupMember,
} from '@/modules/groups';

afterAll(async () => {
  await closePool();
});

async function countRows(sql: string, params: unknown[]): Promise<number> {
  const rows = await query<{ count: number }>(sql, params);
  return Number(rows[0]?.count ?? 0);
}

async function makeUser(): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `member-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

async function makeGroupWithMember(): Promise<{
  admin: Actor;
  member: Actor;
  groupId: number;
}> {
  const admin = await makeUser();
  const member = await makeUser();
  const created = await createGroup(admin, { name: `Участники ${randomUUID().slice(0, 8)}` });
  if (!created.ok) {
    throw new Error(created.message);
  }
  const joined = await joinGroup(member, { groupId: created.value.id });
  if (!joined.ok) {
    throw new Error(joined.message);
  }
  return { admin, member, groupId: created.value.id };
}

describe('changeGroupRole', () => {
  it('promotes a member to administrator and back', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();

    const promoted = await changeGroupRole(admin, { groupId, userId: member.id, role: 'admin' });
    expect(promoted.ok).toBe(true);
    expect(await getGroupRole(groupId, member.id)).toBe('admin');

    const demoted = await changeGroupRole(admin, { groupId, userId: member.id, role: 'member' });
    expect(demoted.ok).toBe(true);
    expect(await getGroupRole(groupId, member.id)).toBe('member');
  });

  it('refuses to demote the last administrator', async () => {
    const { admin, groupId } = await makeGroupWithMember();
    const result = await changeGroupRole(admin, { groupId, userId: admin.id, role: 'member' });
    expect(result).toMatchObject({ ok: false, code: 'CONFLICT' });
    expect(await getGroupRole(groupId, admin.id)).toBe('admin');
  });

  it('rejects a non-administrator and an unknown member', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();

    const denied = await changeGroupRole(member, { groupId, userId: member.id, role: 'admin' });
    expect(denied).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const missing = await changeGroupRole(admin, { groupId, userId: 9_999_999_999, role: 'admin' });
    expect(missing).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });
});

describe('removeGroupMember', () => {
  it('removes a member and reflects it on the group', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();

    const removed = await removeGroupMember(admin, { groupId, userId: member.id });
    expect(removed.ok).toBe(true);

    const group = await getGroup(admin, groupId);
    expect(group.ok).toBe(true);
    if (!group.ok) return;
    expect(group.value.members.map((entry) => entry.id)).not.toContain(member.id);
  });

  it('refuses an administrator removing themselves', async () => {
    const { admin, groupId } = await makeGroupWithMember();
    const result = await removeGroupMember(admin, { groupId, userId: admin.id });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await getGroupRole(groupId, admin.id)).toBe('admin');
  });

  it('rejects a non-administrator', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();
    const denied = await removeGroupMember(member, { groupId, userId: admin.id });
    expect(denied).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});

describe('leaveGroup', () => {
  it('lets a member leave and removes the group from their list', async () => {
    const { member, groupId } = await makeGroupWithMember();

    const left = await leaveGroup(member, { groupId });
    expect(left.ok).toBe(true);
    expect(await getGroupRole(groupId, member.id)).toBeNull();

    const groups = await getGroups(member);
    expect(groups.ok).toBe(true);
    if (!groups.ok) return;
    expect(groups.value.map((group) => group.id)).not.toContain(groupId);
  });

  it('rejects a second leave, a non-member and an administrator', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();
    const stranger = await makeUser();

    expect((await leaveGroup(member, { groupId })).ok).toBe(true);
    expect(await leaveGroup(member, { groupId })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await leaveGroup(stranger, { groupId })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await leaveGroup(admin, { groupId })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await getGroupRole(groupId, admin.id)).toBe('admin');
  });
});

describe('dissolveGroup', () => {
  it('deletes the group and all of its data for an administrator', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();
    const invitee = await makeUser();

    await query(
      `INSERT INTO group_invitations (group_id, inviter_id, invitee_id, status)
       VALUES ($1, $2, $3, 0)`,
      [groupId, admin.id, invitee.id],
    );
    const media = await query<{ id: number }>(
      `INSERT INTO media (kind, external_ref, title) VALUES (0, $1, $2) RETURNING id`,
      [`dissolve-${randomUUID().slice(0, 8)}`, 'Растворение'],
    );
    await query(
      `INSERT INTO ratings (user_id, media_id, group_id, rating) VALUES ($1, $2, $3, 80)`,
      [member.id, media[0]!.id, groupId],
    );
    const discussion = await query<{ id: number }>(
      `INSERT INTO group_discussions (group_id, author_id, title) VALUES ($1, $2, $3) RETURNING id`,
      [groupId, admin.id, 'Обсуждение'],
    );
    await query(
      `INSERT INTO discussion_posts (discussion_id, author_id, body) VALUES ($1, $2, $3)`,
      [discussion[0]!.id, member.id, 'Пост'],
    );
    const event = await query<{ id: number }>(
      `INSERT INTO activity_events (actor_id, kind, group_id) VALUES ($1, 3, $2) RETURNING id`,
      [member.id, groupId],
    );

    const dissolved = await dissolveGroup(admin, { groupId });
    expect(dissolved.ok).toBe(true);

    expect(await getGroup(admin, groupId)).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(await countRows('SELECT count(*)::int AS count FROM groups WHERE id = $1', [groupId])).toBe(0);
    expect(
      await countRows('SELECT count(*)::int AS count FROM group_members WHERE group_id = $1', [
        groupId,
      ]),
    ).toBe(0);
    expect(
      await countRows('SELECT count(*)::int AS count FROM group_invitations WHERE group_id = $1', [
        groupId,
      ]),
    ).toBe(0);
    expect(
      await countRows('SELECT count(*)::int AS count FROM ratings WHERE group_id = $1', [groupId]),
    ).toBe(0);
    expect(
      await countRows('SELECT count(*)::int AS count FROM group_discussions WHERE group_id = $1', [
        groupId,
      ]),
    ).toBe(0);
    expect(
      await countRows('SELECT count(*)::int AS count FROM discussion_posts WHERE discussion_id = $1', [
        discussion[0]!.id,
      ]),
    ).toBe(0);
    expect(
      await countRows('SELECT count(*)::int AS count FROM activity_events WHERE id = $1', [
        event[0]!.id,
      ]),
    ).toBe(0);
  });

  it('rejects a non-administrator without changing the group', async () => {
    const { admin, member, groupId } = await makeGroupWithMember();

    const denied = await dissolveGroup(member, { groupId });
    expect(denied).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const group = await getGroup(admin, groupId);
    expect(group.ok).toBe(true);
  });
});
