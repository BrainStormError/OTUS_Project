import { beforeEach, describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const {
  getActorMock,
  createGroupMock,
  updateGroupMock,
  changeGroupRoleMock,
  removeGroupMemberMock,
  leaveGroupMock,
  dissolveGroupMock,
  inviteToGroupMock,
  respondInvitationMock,
  cancelInvitationMock,
} = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  createGroupMock: vi.fn(),
  updateGroupMock: vi.fn(),
  changeGroupRoleMock: vi.fn(),
  removeGroupMemberMock: vi.fn(),
  leaveGroupMock: vi.fn(),
  dissolveGroupMock: vi.fn(),
  inviteToGroupMock: vi.fn(),
  respondInvitationMock: vi.fn(),
  cancelInvitationMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/groups', async () => {
  const schema = await vi.importActual<typeof import('@/modules/groups/schema')>(
    '@/modules/groups/schema',
  );
  return {
    createGroupInput: schema.createGroupInput,
    updateGroupInput: schema.updateGroupInput,
    groupRoleInput: schema.groupRoleInput,
    removeGroupMemberInput: schema.removeGroupMemberInput,
    leaveGroupInput: schema.leaveGroupInput,
    dissolveGroupInput: schema.dissolveGroupInput,
    inviteToGroupInput: schema.inviteToGroupInput,
    respondInvitationInput: schema.respondInvitationInput,
    invitationIdInput: schema.invitationIdInput,
    createGroup: createGroupMock,
    updateGroup: updateGroupMock,
    changeGroupRole: changeGroupRoleMock,
    removeGroupMember: removeGroupMemberMock,
    leaveGroup: leaveGroupMock,
    dissolveGroup: dissolveGroupMock,
    inviteToGroup: inviteToGroupMock,
    respondInvitation: respondInvitationMock,
    cancelInvitation: cancelInvitationMock,
  };
});

import { POST as createGroupRoute } from '@/app/api/groups/route';
import { DELETE as dissolveGroupRoute, PATCH as updateGroupRoute } from '@/app/api/groups/[id]/route';
import { DELETE as leaveGroupRoute } from '@/app/api/groups/[id]/membership/route';
import {
  DELETE as removeMemberRoute,
  PATCH as changeRoleRoute,
} from '@/app/api/groups/[id]/members/[userId]/route';
import { POST as inviteRoute } from '@/app/api/groups/[id]/invitations/route';
import {
  DELETE as cancelInvitationRoute,
  POST as respondInvitationRoute,
} from '@/app/api/groups/invitations/[id]/route';

const actor = { id: 1, role: 'employee' as const };
const origin = { origin: 'http://localhost:3000' };

function request(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json', ...origin },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/groups', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await createGroupRoute(request('http://localhost/api/groups', 'POST', { name: 'Группа' }));
    expect(response.status).toBe(401);
  });

  it('returns 400 for an invalid body', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await createGroupRoute(request('http://localhost/api/groups', 'POST', { name: '  ' }));
    expect(response.status).toBe(400);
  });

  it('maps a duplicate name to 409', async () => {
    getActorMock.mockResolvedValue(actor);
    createGroupMock.mockResolvedValue(err('CONFLICT', 'Группа с таким названием уже существует'));
    const response = await createGroupRoute(
      request('http://localhost/api/groups', 'POST', { name: 'Классика' }),
    );
    expect(response.status).toBe(409);
    expect(createGroupMock).toHaveBeenCalledWith(actor, expect.objectContaining({ name: 'Классика' }));
  });

  it('creates a group and returns its id', async () => {
    getActorMock.mockResolvedValue(actor);
    createGroupMock.mockResolvedValue(ok({ id: 42 }));
    const response = await createGroupRoute(
      request('http://localhost/api/groups', 'POST', { name: 'Классика' }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 42 });
  });
});

describe('PATCH /api/groups/[id]', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await updateGroupRoute(
      request('http://localhost/api/groups/3', 'PATCH', { name: 'Новое' }),
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 for a non-numeric id', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await updateGroupRoute(
      request('http://localhost/api/groups/x', 'PATCH', { name: 'Новое' }),
    );
    expect(response.status).toBe(400);
  });

  it('maps a forbidden edit to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    updateGroupMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await updateGroupRoute(
      request('http://localhost/api/groups/3', 'PATCH', { restricted: true }),
    );
    expect(response.status).toBe(403);
    expect(updateGroupMock).toHaveBeenCalledWith(actor, { groupId: 3, restricted: true });
  });

  it('updates a group', async () => {
    getActorMock.mockResolvedValue(actor);
    updateGroupMock.mockResolvedValue(ok({ id: 3 }));
    const response = await updateGroupRoute(
      request('http://localhost/api/groups/3', 'PATCH', { name: 'Новое' }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 3 });
  });
});

describe('PATCH/DELETE /api/groups/[id]/members/[userId]', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await changeRoleRoute(
      request('http://localhost/api/groups/3/members/7', 'PATCH', { role: 'member' }),
    );
    expect(response.status).toBe(401);
  });

  it('changes a role for an admin', async () => {
    getActorMock.mockResolvedValue(actor);
    changeGroupRoleMock.mockResolvedValue(ok(null));
    const response = await changeRoleRoute(
      request('http://localhost/api/groups/3/members/7', 'PATCH', { role: 'member' }),
    );
    expect(response.status).toBe(200);
    expect(changeGroupRoleMock).toHaveBeenCalledWith(actor, {
      groupId: 3,
      userId: 7,
      role: 'member',
    });
  });

  it('maps a last-admin conflict to 409', async () => {
    getActorMock.mockResolvedValue(actor);
    changeGroupRoleMock.mockResolvedValue(err('CONFLICT', 'Нельзя понизить последнего администратора'));
    const response = await changeRoleRoute(
      request('http://localhost/api/groups/3/members/7', 'PATCH', { role: 'member' }),
    );
    expect(response.status).toBe(409);
  });

  it('removes a member for an admin', async () => {
    getActorMock.mockResolvedValue(actor);
    removeGroupMemberMock.mockResolvedValue(ok(null));
    const response = await removeMemberRoute(request('http://localhost/api/groups/3/members/7', 'DELETE'));
    expect(response.status).toBe(200);
    expect(removeGroupMemberMock).toHaveBeenCalledWith(actor, { groupId: 3, userId: 7 });
  });

  it('returns 400 for a non-numeric user id', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await removeMemberRoute(request('http://localhost/api/groups/3/members/x', 'DELETE'));
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/groups/[id]/membership', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await leaveGroupRoute(
      request('http://localhost/api/groups/3/membership', 'DELETE'),
    );
    expect(response.status).toBe(401);
    expect(leaveGroupMock).not.toHaveBeenCalled();
  });

  it('leaves a group for a member', async () => {
    getActorMock.mockResolvedValue(actor);
    leaveGroupMock.mockResolvedValue(ok(null));
    const response = await leaveGroupRoute(
      request('http://localhost/api/groups/3/membership', 'DELETE'),
    );
    expect(response.status).toBe(200);
    expect(leaveGroupMock).toHaveBeenCalledWith(actor, { groupId: 3 });
  });

  it('maps a forbidden leave to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    leaveGroupMock.mockResolvedValue(err('FORBIDDEN', 'Администратор не может покинуть группу'));
    const response = await leaveGroupRoute(
      request('http://localhost/api/groups/3/membership', 'DELETE'),
    );
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/groups/[id]', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await dissolveGroupRoute(request('http://localhost/api/groups/3', 'DELETE'));
    expect(response.status).toBe(401);
    expect(dissolveGroupMock).not.toHaveBeenCalled();
  });

  it('dissolves a group for an admin', async () => {
    getActorMock.mockResolvedValue(actor);
    dissolveGroupMock.mockResolvedValue(ok(null));
    const response = await dissolveGroupRoute(request('http://localhost/api/groups/3', 'DELETE'));
    expect(response.status).toBe(200);
    expect(dissolveGroupMock).toHaveBeenCalledWith(actor, { groupId: 3 });
  });

  it('returns 400 for a non-numeric id', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await dissolveGroupRoute(request('http://localhost/api/groups/x', 'DELETE'));
    expect(response.status).toBe(400);
  });

  it('maps a forbidden dissolve to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    dissolveGroupMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await dissolveGroupRoute(request('http://localhost/api/groups/3', 'DELETE'));
    expect(response.status).toBe(403);
  });
});

describe('invitation routes', () => {
  it('returns 401 for invites without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await inviteRoute(
      request('http://localhost/api/groups/3/invitations', 'POST', { inviteeId: 7 }),
    );
    expect(response.status).toBe(401);
  });

  it('invites a user as an admin', async () => {
    getActorMock.mockResolvedValue(actor);
    inviteToGroupMock.mockResolvedValue(ok({ id: 9 }));
    const response = await inviteRoute(
      request('http://localhost/api/groups/3/invitations', 'POST', { inviteeId: 7 }),
    );
    expect(response.status).toBe(200);
    expect(inviteToGroupMock).toHaveBeenCalledWith(actor, { groupId: 3, inviteeId: 7 });
  });

  it('maps a forbidden invite to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    inviteToGroupMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await inviteRoute(
      request('http://localhost/api/groups/3/invitations', 'POST', { inviteeId: 7 }),
    );
    expect(response.status).toBe(403);
  });

  it('responds to an invitation', async () => {
    getActorMock.mockResolvedValue(actor);
    respondInvitationMock.mockResolvedValue(ok({ id: 9 }));
    const response = await respondInvitationRoute(
      request('http://localhost/api/groups/invitations/9', 'POST', { decision: 'accept' }),
    );
    expect(response.status).toBe(200);
    expect(respondInvitationMock).toHaveBeenCalledWith(actor, {
      invitationId: 9,
      decision: 'accept',
    });
  });

  it('maps a non-invitee response to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    respondInvitationMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await respondInvitationRoute(
      request('http://localhost/api/groups/invitations/9', 'POST', { decision: 'decline' }),
    );
    expect(response.status).toBe(403);
  });

  it('cancels an invitation as an admin', async () => {
    getActorMock.mockResolvedValue(actor);
    cancelInvitationMock.mockResolvedValue(ok(null));
    const response = await cancelInvitationRoute(
      request('http://localhost/api/groups/invitations/9', 'DELETE'),
    );
    expect(response.status).toBe(200);
    expect(cancelInvitationMock).toHaveBeenCalledWith(actor, { invitationId: 9 });
  });
});
