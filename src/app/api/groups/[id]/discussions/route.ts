import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { createDiscussion, createDiscussionInput } from '@/modules/discussions';

export const POST = withRoute(
  {
    operation: 'groups.discussions.create',
    schema: createDiscussionInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await createDiscussion(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
