import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import {
  dissolveGroup,
  dissolveGroupInput,
  updateGroup,
  updateGroupInput,
} from '@/modules/groups';

export const PATCH = withRoute(
  {
    operation: 'groups.update',
    schema: updateGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await updateGroup(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);

export const DELETE = withRoute(
  {
    operation: 'groups.dissolve',
    schema: dissolveGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const result = await dissolveGroup(actor, input);
    return result.ok ? ok({ ok: true }) : result;
  },
);
