import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { createFriendRequest, createFriendRequestInput } from '@/modules/friendships';

export const POST = withRoute(
  {
    operation: 'friendships.create',
    schema: createFriendRequestInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await createFriendRequest(actor, input);
    return result.ok
      ? ok({ id: result.value.id, status: result.value.status })
      : result;
  },
);
