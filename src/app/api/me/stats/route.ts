import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { getOwnProfile } from '@/modules/profiles';

const emptyQuery = z.object({}).strict();

export const GET = withRoute(
  {
    operation: 'me.stats.read',
    schema: z.undefined(),
    querySchema: emptyQuery,
    resolveActor: getActor,
    headers: { 'cache-control': CACHE_SINGLE_AUTHOR },
  },
  async (_input, { actor }) => {
    const profile = await getOwnProfile(actor);
    return profile.ok ? ok(profile.value.stats) : profile;
  },
);
