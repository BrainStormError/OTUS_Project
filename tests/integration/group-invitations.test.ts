import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';
import { insertUser } from '@/modules/auth/repository';
import {
  cancelInvitation,
  createGroup,
  getGroupRole,
  inviteToGroup,
  joinGroup,
  listGroupInvitations,
  listMyInvitations,
  respondInvitation,
} from '@/modules/groups';
import {
  deletePendingInvitation,
  findInvitationById,
  listPendingInvitationsForUser,
  setInvitationStatus,
  upsertInvitation,
} from '@/modules/groups/repository';

afterAll(async () => {
  await closePool();
});

async function makeUser(): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `invite-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

async function makeAdminGroup(): Promise<{ admin: Actor; groupId: number }> {
  const admin = await makeUser();
  const created = await createGroup(admin, { name: `Приглашения ${randomUUID().slice(0, 8)}` });
  if (!created.ok) {
    throw new Error(created.message);
  }
  return { admin, groupId: created.value.id };
}

describe('invitation repository', () => {
  it('upserts a pending invitation and reopens it after a decline', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();

    const first = await withTransaction((tx) =>
      upsertInvitation(tx, groupId, admin.id, invitee.id),
    );
    expect(first.status).toBe('pending');

    const repeat = await withTransaction((tx) =>
      upsertInvitation(tx, groupId, admin.id, invitee.id),
    );
    expect(repeat.id).toBe(first.id);
    expect(repeat.status).toBe('pending');

    const declined = await withTransaction((tx) =>
      setInvitationStatus(tx, first.id, invitee.id, 'declined'),
    );
    expect(declined?.status).toBe('declined');

    const reopened = await withTransaction((tx) =>
      upsertInvitation(tx, groupId, admin.id, invitee.id),
    );
    expect(reopened.id).toBe(first.id);
    expect(reopened.status).toBe('pending');
  });

  it('lists a pending invitation with the group and inviter for the invitee', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    await withTransaction((tx) => upsertInvitation(tx, groupId, admin.id, invitee.id));

    const pending = await listPendingInvitationsForUser(invitee.id);
    const invitation = pending.find((item) => item.groupId === groupId);
    expect(invitation).toBeDefined();
    expect(invitation?.inviterId).toBe(admin.id);
    expect(invitation?.groupName).toContain('Приглашения');
  });

  it('only transitions a pending invitation once', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    const created = await withTransaction((tx) =>
      upsertInvitation(tx, groupId, admin.id, invitee.id),
    );

    const accepted = await withTransaction((tx) =>
      setInvitationStatus(tx, created.id, invitee.id, 'accepted'),
    );
    expect(accepted?.status).toBe('accepted');

    const again = await withTransaction((tx) =>
      setInvitationStatus(tx, created.id, invitee.id, 'declined'),
    );
    expect(again).toBeNull();

    const stored = await findInvitationById(created.id);
    expect(stored?.status).toBe('accepted');
  });

  it('deletes a pending invitation', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    const created = await withTransaction((tx) =>
      upsertInvitation(tx, groupId, admin.id, invitee.id),
    );

    const deleted = await withTransaction((tx) =>
      deletePendingInvitation(tx, created.id, groupId),
    );
    expect(deleted).toBe(true);
    expect(await findInvitationById(created.id)).toBeNull();
  });
});

describe('inviteToGroup', () => {
  it('lets an administrator invite a real user and is idempotent while pending', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();

    const first = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.id).toBe(first.value.id);
  });

  it('rejects a non-administrator, an unknown user and an existing member', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const member = await makeUser();
    await joinGroup(member, { groupId });

    const denied = await inviteToGroup(member, { groupId, inviteeId: (await makeUser()).id });
    expect(denied).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const unknown = await inviteToGroup(admin, { groupId, inviteeId: 9_999_999_999 });
    expect(unknown).toMatchObject({ ok: false, code: 'NOT_FOUND' });

    const memberInvite = await inviteToGroup(admin, { groupId, inviteeId: member.id });
    expect(memberInvite).toMatchObject({ ok: false, code: 'CONFLICT' });
  });
});

describe('respondInvitation', () => {
  it('accepts a pending invitation and joins the invitee as a member', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    const invited = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    if (!invited.ok) throw new Error(invited.message);

    const accepted = await respondInvitation(invitee, {
      invitationId: invited.value.id,
      decision: 'accept',
    });
    expect(accepted.ok).toBe(true);
    expect(await getGroupRole(groupId, invitee.id)).toBe('member');
  });

  it('declines without granting membership', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    const invited = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    if (!invited.ok) throw new Error(invited.message);

    const declined = await respondInvitation(invitee, {
      invitationId: invited.value.id,
      decision: 'decline',
    });
    expect(declined.ok).toBe(true);
    expect(await getGroupRole(groupId, invitee.id)).toBeNull();
  });

  it('only lets the invitee decide', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    const stranger = await makeUser();
    const invited = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    if (!invited.ok) throw new Error(invited.message);

    const denied = await respondInvitation(stranger, {
      invitationId: invited.value.id,
      decision: 'accept',
    });
    expect(denied).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});

describe('listGroupInvitations and cancelInvitation', () => {
  it('lists pending invitations for an administrator and withdraws them', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const invitee = await makeUser();
    const invited = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    if (!invited.ok) throw new Error(invited.message);

    const listed = await listGroupInvitations(admin, groupId);
    expect(listed.ok && listed.value.map((item) => item.id)).toContain(invited.value.id);

    const cancelled = await cancelInvitation(admin, { invitationId: invited.value.id });
    expect(cancelled.ok).toBe(true);

    const mine = await listMyInvitations(invitee);
    expect(mine.ok && mine.value).toHaveLength(0);
  });

  it('forbids a non-administrator from listing or cancelling', async () => {
    const { admin, groupId } = await makeAdminGroup();
    const stranger = await makeUser();
    const invitee = await makeUser();
    const invited = await inviteToGroup(admin, { groupId, inviteeId: invitee.id });
    if (!invited.ok) throw new Error(invited.message);

    expect(await listGroupInvitations(stranger, groupId)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
    expect(
      await cancelInvitation(stranger, { invitationId: invited.value.id }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});
