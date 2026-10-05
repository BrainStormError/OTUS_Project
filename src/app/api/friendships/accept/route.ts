import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { acceptFriendship, friendshipDecisionInput } from '@/modules/friendships';

export const POST = withRoute(
  {
    operation: 'friendships.accept',
    schema: friendshipDecisionInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await acceptFriendship(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
