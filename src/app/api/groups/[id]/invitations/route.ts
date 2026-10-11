import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { inviteToGroup, inviteToGroupInput } from '@/modules/groups';

export const POST = withRoute(
  {
    operation: 'groups.invitations.create',
    schema: inviteToGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await inviteToGroup(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
