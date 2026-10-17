import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import {
  createGroup,
  createGroupInput,
  getDiscoverableGroups,
  getGroups,
  listMyInvitations,
} from '@/modules/groups';

const emptyQuery = z.object({}).strict();

export const GET = withRoute(
  {
    operation: 'groups.read',
    schema: z.undefined(),
    querySchema: emptyQuery,
    resolveActor: getActor,
    headers: { 'cache-control': CACHE_SINGLE_AUTHOR },
  },
  async (_input, { actor }) => {
    const [groups, discover, invitations] = await Promise.all([
      getGroups(actor),
      getDiscoverableGroups(actor),
      listMyInvitations(actor),
    ]);
    if (!groups.ok) {
      return groups;
    }
    if (!discover.ok) {
      return discover;
    }
    if (!invitations.ok) {
      return invitations;
    }
    return ok({
      groups: groups.value,
      discover: discover.value,
      invitations: invitations.value,
    });
  },
);

export const POST = withRoute(
  {
    operation: 'groups.create',
    schema: createGroupInput,
    resolveActor: getActor,
    rateLimit: { limit: 10, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await createGroup(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
