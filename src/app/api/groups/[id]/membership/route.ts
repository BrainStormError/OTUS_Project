import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { leaveGroup, leaveGroupInput } from '@/modules/groups';

export const DELETE = withRoute(
  {
    operation: 'groups.membership.leave',
    schema: leaveGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await leaveGroup(actor, input);
    return result.ok ? ok({ ok: true }) : result;
  },
);
