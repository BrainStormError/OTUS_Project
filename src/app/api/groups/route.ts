import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { createGroup, createGroupInput } from '@/modules/groups';

export const POST = withRoute(
  {
    operation: 'groups.create',
    schema: createGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 10, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await createGroup(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
