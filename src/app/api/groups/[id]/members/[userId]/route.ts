import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import {
  changeGroupRole,
  groupRoleInput,
  removeGroupMember,
  removeGroupMemberInput,
} from '@/modules/groups';

function memberPath(url: URL): { groupId: number | null; userId: number | null } {
  const segments = url.pathname.split('/');
  return {
    groupId: parsePositiveInt(segments[3]),
    userId: parsePositiveInt(segments[5]),
  };
}

export const PATCH = withRoute(
  {
    operation: 'groups.members.update_role',
    schema: groupRoleInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: memberPath,
  },
  async (input, { actor }) => {
    const result = await changeGroupRole(actor, input);
    return result.ok ? ok({ ok: true }) : result;
  },
);

export const DELETE = withRoute(
  {
    operation: 'groups.members.remove',
    schema: removeGroupMemberInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: memberPath,
  },
  async (input, { actor }) => {
    const result = await removeGroupMember(actor, input);
    return result.ok ? ok({ ok: true }) : result;
  },
);
