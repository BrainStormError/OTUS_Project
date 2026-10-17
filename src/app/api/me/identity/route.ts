import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { identityUpdateInput, updateIdentity } from '@/modules/auth';
import { getActor } from '@/modules/auth/session';

const emptyQuery = z.object({}).strict();

export const GET = withRoute(
  {
    operation: 'me.identity.read',
    schema: z.undefined(),
    querySchema: emptyQuery,
    resolveActor: getActor,
    headers: { 'cache-control': CACHE_SINGLE_AUTHOR },
  },
  async (_input, { actor }) =>
    ok({
      id: actor.id,
      name: actor.name ?? actor.email ?? '',
      handle: actor.handle ?? String(actor.id),
    }),
);

export const PATCH = withRoute(
  {
    operation: 'me.identity.update',
    schema: identityUpdateInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await updateIdentity(actor, input);
    return result.ok ? ok(result.value) : result;
  },
);
