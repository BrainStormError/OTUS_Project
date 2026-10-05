import type { FriendRequestSummary, SocialUser } from '@/modules/friendships';
import type { GroupSummary } from '@/modules/groups';

import type { FriendRequest, Group, PublicUser, UserStats } from './types';

const EMPTY_STATS: UserStats = { count: 0, genres: [], years: [] };

export function toPublicUser(user: SocialUser): PublicUser {
  return {
    id: user.id,
    handle: user.handle,
    name: user.name,
    stats: EMPTY_STATS,
    recent: [],
  };
}

export function toFriendRequest(request: FriendRequestSummary): FriendRequest {
  return { id: request.id, user: toPublicUser(request.user) };
}

export function toGroup(group: GroupSummary): Group {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? undefined,
    tags: group.tags,
    members: group.members,
    stats: EMPTY_STATS,
    restricted: group.restricted,
  };
}
