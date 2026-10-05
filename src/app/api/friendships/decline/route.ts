import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { declineFriendship, friendshipDecisionInput } from '@/modules/friendships';

export const POST = withRoute(
  {
    operation: 'friendships.decline',
    schema: friendshipDecisionInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await declineFriendship(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
