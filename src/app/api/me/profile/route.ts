import { z } from 'zod';

import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { getOwnProfile } from '@/modules/profiles';

const emptyQuery = z.object({}).strict();

export const GET = withRoute(
  {
    operation: 'me.profile.read',
    schema: z.undefined(),
    querySchema: emptyQuery,
    resolveActor: getActor,
  },
  async (_input, { actor }) => {
    const profile = await getOwnProfile(actor);
    return profile.ok ? ok(profile.value) : profile;
  },
);
