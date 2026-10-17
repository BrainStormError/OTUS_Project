import { z } from 'zod';

import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { getProfileByHandle } from '@/modules/profiles';

const profileParams = z.object({
  handle: z.string().trim().min(1).max(50),
});

function handleFromPath(url: URL): string {
  const segment = url.pathname.split('/')[3] ?? '';
  try {
    return decodeURIComponent(segment);
  } catch {
    return '';
  }
}

export const GET = withRoute(
  {
    operation: 'profiles.read',
    schema: profileParams,
    resolveActor: getActor,
    pathParams: (url) => ({ handle: handleFromPath(url) }),
  },
  async (input, { actor }) => {
    const result = await getProfileByHandle(actor, input.handle);
    return result.ok ? ok(result.value) : result;
  },
);
