import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { identityUpdateInput, updateIdentity } from '@/modules/auth';
import { getActor } from '@/modules/auth/session';

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
