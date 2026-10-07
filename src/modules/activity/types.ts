export type ActivityKind =
  | 'film_rated'
  | 'series_rated'
  | 'friendship_accepted'
  | 'group_joined'
  | 'post_created'
  | 'comment_created';

export type ActivityEvent = {
  id: number;
  actorId: number;
  kind: ActivityKind;
  groupId: number | null;
  mediaId: number | null;
  discussionId: number | null;
  createdAt: string;
};

export type FeedItem = ActivityEvent & {
  actorName: string | null;
  actorHandle: string | null;
  groupName: string | null;
  title: string | null;
  rating: number | null;
  href: string | null;
};

export type ActivityCursor = {
  createdAt: string;
  id: number;
};

export type ListFeedResult = {
  items: FeedItem[];
  nextCursor: string | null;
};

export type NewActivityEvent = {
  actorId: number;
  kind: ActivityKind;
  groupId?: number | null;
  mediaId?: number | null;
  discussionId?: number | null;
};
