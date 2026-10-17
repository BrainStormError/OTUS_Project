import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import {
  createFriendRequest,
  createFriendRequestInput,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
} from '@/modules/friendships';

const emptyQuery = z.object({}).strict();

export const GET = withRoute(
  {
    operation: 'friendships.read',
    schema: z.undefined(),
    querySchema: emptyQuery,
    resolveActor: getActor,
    headers: { 'cache-control': CACHE_SINGLE_AUTHOR },
  },
  async (_input, { actor }) => {
    const [friends, incoming, outgoing] = await Promise.all([
      getFriends(actor),
      getIncomingRequests(actor),
      getOutgoingRequests(actor),
    ]);
    if (!friends.ok) {
      return friends;
    }
    if (!incoming.ok) {
      return incoming;
    }
    if (!outgoing.ok) {
      return outgoing;
    }
    return ok({
      friends: friends.value,
      incoming: incoming.value,
      outgoing: outgoing.value,
    });
  },
);

export const POST = withRoute(
  {
    operation: 'friendships.create',
    schema: createFriendRequestInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await createFriendRequest(actor, input);
    return result.ok
      ? ok({ id: result.value.id, status: result.value.status })
      : result;
  },
);
