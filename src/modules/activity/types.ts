export type ActivityKind =
  | 'film_rated'
  | 'series_rated'
  | 'friendship_accepted'
  | 'group_joined'
  | 'post_created'
  | 'comment_created';

export type ActivityTargetType = 'film' | 'series' | 'user' | 'group';

export type ActivityPayload = {
  title?: string;
  rating?: number;
  year?: number;
  href?: string;
  [key: string]: unknown;
};

export type ActivityEvent = {
  id: string;
  actorId: string;
  kind: ActivityKind;
  groupId: string | null;
  targetType: string;
  targetId: string;
  payload: ActivityPayload;
  createdAt: string;
};

export type FeedItem = ActivityEvent & {
  actorName: string | null;
  actorHandle: string | null;
  groupName: string | null;
};

export type ActivityCursor = {
  createdAt: string;
  id: string;
};

export type ListFeedResult = {
  items: FeedItem[];
  nextCursor: string | null;
};

export type NewActivityEvent = {
  actorId: string;
  kind: ActivityKind;
  targetType: ActivityTargetType;
  targetId: string;
  groupId?: string | null;
  payload?: ActivityPayload;
};
