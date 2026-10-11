import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { addComment, createPostInput } from '@/modules/discussions';

export const POST = withRoute(
  {
    operation: 'discussions.posts.create',
    schema: createPostInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
    pathParams: (url) => ({ discussionId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await addComment(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
