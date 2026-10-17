import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getPrivacy, privacyInput, updatePrivacy } from '@/modules/auth';
import { getActor } from '@/modules/auth/session';

const emptyQuery = z.object({}).strict();

export const GET = withRoute(
  {
    operation: 'me.privacy.read',
    schema: z.undefined(),
    querySchema: emptyQuery,
    resolveActor: getActor,
    headers: { 'cache-control': CACHE_SINGLE_AUTHOR },
  },
  async (_input, { actor }) => {
    const result = await getPrivacy(actor);
    return result.ok ? ok(result.value) : result;
  },
);

export const PATCH = withRoute(
  {
    operation: 'me.privacy.update',
    schema: privacyInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await updatePrivacy(actor, input);
    return result.ok ? ok(result.value) : result;
  },
);
