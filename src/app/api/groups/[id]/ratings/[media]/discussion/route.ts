import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { attachDiscussion, attachDiscussionInput } from '@/modules/discussions';

export const POST = withRoute(
  {
    operation: 'groups.ratings.attach',
    schema: attachDiscussionInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => {
      const segments = url.pathname.split('/');
      return {
        groupId: parsePositiveInt(segments[3]),
        mediaId: parsePositiveInt(segments[5]),
      };
    },
  },
  async (input, { actor }) => {
    const result = await attachDiscussion(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
