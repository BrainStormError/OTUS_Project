import { z } from 'zod';

import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { listGroupFeed, type FeedItem } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';
import { listDiscussionDetails } from '@/modules/discussions';
import {
  dissolveGroup,
  dissolveGroupInput,
  getGroup,
  getGroupRole,
  listGroupInvitations,
  listGroupRatings,
  updateGroup,
  updateGroupInput,
  type GroupInvitation,
} from '@/modules/groups';

const groupParams = z.object({
  groupId: z.number().int().positive(),
});

export const GET = withRoute(
  {
    operation: 'groups.read.one',
    schema: groupParams,
    resolveActor: getActor,
    pathParams: (url) => ({ groupId: parsePositiveInt(url.pathname.split('/')[3]) }),
  },
  async (input, { actor }) => {
    const group = await getGroup(actor, input.groupId);
    if (!group.ok) {
      return group;
    }

    const role = await getGroupRole(input.groupId, actor.id);
    const discussions = await listDiscussionDetails(actor, input.groupId);
    if (!discussions.ok) {
      return discussions;
    }
    const ratings = await listGroupRatings(actor, input.groupId);
    if (!ratings.ok) {
      return ratings;
    }

    let activity: FeedItem[] = [];
    if (role !== null) {
      const feed = await listGroupFeed(actor, input.groupId, { limit: 20 });
      activity = feed.ok ? feed.value.items : [];
    }

    let invitations: GroupInvitation[] = [];
    if (role === 'admin') {
      const list = await listGroupInvitations(actor, input.groupId);
      invitations = list.ok ? list.value : [];
    }

    return ok({
      group: group.value,
      role,
      discussions: discussions.value,
      ratings: ratings.value,
      activity,
      invitations,
    });
  },
);

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
