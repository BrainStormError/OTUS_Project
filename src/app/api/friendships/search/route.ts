import { z } from 'zod';

import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { searchUsers, userSearchInput } from '@/modules/friendships';

export const GET = withRoute(
  {
    operation: 'friendships.search',
    schema: z.undefined(),
    querySchema: userSearchInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (_input, { actor, query }) => {
    const result = await searchUsers(actor, query);
    return result.ok ? ok({ items: result.value }) : result;
  },
);
