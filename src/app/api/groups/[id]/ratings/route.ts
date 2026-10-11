import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { groupRatingInput, saveGroupRating } from '@/modules/groups';

export const POST = withRoute(
  {
    operation: 'groups.ratings.save',
    schema: groupRatingInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await saveGroupRating(actor, input);
    return result.ok ? ok({ userId: result.value.userId }) : result;
  },
);
