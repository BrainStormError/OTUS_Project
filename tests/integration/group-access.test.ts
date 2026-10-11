import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import { createDiscussion, getDiscussion, listDiscussions } from '@/modules/discussions';
import { canViewGroup, getGroup, listGroupRatings } from '@/modules/groups';

afterAll(async () => {
  await closePool();
});

async function makeUser(): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `access-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

async function makeGroup(
  restricted: boolean,
  members: { userId: number; role: 'admin' | 'member' }[] = [],
): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO groups (name, restricted) VALUES ($1, $2) RETURNING id`,
    [`group-${randomUUID().slice(0, 8)}`, restricted],
  );
  const groupId = rows[0]!.id;
  for (const member of members) {
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`, [
      groupId,
      member.userId,
      member.role === 'admin' ? 1 : 0,
    ]);
  }
  return groupId;
}

describe('canViewGroup', () => {
  it('denies everyone without a session', async () => {
    const open = await makeGroup(false);
    expect(await canViewGroup(null, open)).toBe(false);
  });

  it('allows any authenticated actor to view an open group', async () => {
    const stranger = await makeUser();
    const open = await makeGroup(false);
    expect(await canViewGroup(stranger, open)).toBe(true);
  });

  it('denies a non-member and allows members and admins of a restricted group', async () => {
    const member = await makeUser();
    const admin = await makeUser();
    const stranger = await makeUser();
    const restricted = await makeGroup(true, [
      { userId: member.id, role: 'member' },
      { userId: admin.id, role: 'admin' },
    ]);

    expect(await canViewGroup(stranger, restricted)).toBe(false);
    expect(await canViewGroup(member, restricted)).toBe(true);
    expect(await canViewGroup(admin, restricted)).toBe(true);
  });

  it('denies a viewer when the group does not exist', async () => {
    const actor = await makeUser();
    expect(await canViewGroup(actor, 999_999_999)).toBe(false);
  });
});

describe('group-scoped reads self-guard', () => {
  it('denies a non-member read of a restricted group without disclosing it and allows a member', async () => {
    const admin = await makeUser();
    const stranger = await makeUser();
    const restricted = await makeGroup(true, [{ userId: admin.id, role: 'admin' }]);

    expect(await getGroup(stranger, restricted)).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    });
    expect(await listGroupRatings(stranger, restricted)).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    });
    expect(await listDiscussions(stranger, restricted)).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    });

    expect((await getGroup(admin, restricted)).ok).toBe(true);
    expect((await listGroupRatings(admin, restricted)).ok).toBe(true);
    expect((await listDiscussions(admin, restricted)).ok).toBe(true);
  });

  it('keeps an open group readable by a non-member', async () => {
    const stranger = await makeUser();
    const open = await makeGroup(false);

    expect((await getGroup(stranger, open)).ok).toBe(true);
    expect((await listGroupRatings(stranger, open)).ok).toBe(true);
    expect((await listDiscussions(stranger, open)).ok).toBe(true);
  });
});

describe('getDiscussion tenant scoping', () => {
  it('does not return a discussion requested through another group', async () => {
    const admin = await makeUser();
    const other = await makeUser();
    const groupId = await makeGroup(false, [{ userId: admin.id, role: 'admin' }]);
    const otherGroupId = await makeGroup(false, [{ userId: other.id, role: 'admin' }]);

    const created = await createDiscussion(admin, { groupId, title: 'Тема' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const foreign = await getDiscussion(other, created.value.id, otherGroupId);
    expect(foreign).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });

  it('withholds a restricted discussion from a non-member but returns it to a member', async () => {
    const admin = await makeUser();
    const member = await makeUser();
    const stranger = await makeUser();
    const groupId = await makeGroup(true, [
      { userId: admin.id, role: 'admin' },
      { userId: member.id, role: 'member' },
    ]);

    const created = await createDiscussion(admin, { groupId, title: 'Закрытая тема' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const denied = await getDiscussion(stranger, created.value.id, groupId);
    expect(denied).toMatchObject({ ok: false, code: 'NOT_FOUND' });

    const allowed = await getDiscussion(member, created.value.id, groupId);
    expect(allowed.ok).toBe(true);
  });
});
