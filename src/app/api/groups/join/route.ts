import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { joinGroup, joinGroupInput } from '@/modules/groups';

export const POST = withRoute(
  {
    operation: 'groups.join',
    schema: joinGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await joinGroup(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
