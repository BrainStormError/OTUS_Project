export type DiscussionSummary = {
  id: number;
  groupId: number;
  authorId: number;
  authorName: string | null;
  authorHandle: string | null;
  title: string;
  mediaId: number | null;
  commentCount: number;
  createdAt: string;
};

export type DiscussionPost = {
  id: number;
  discussionId: number;
  authorId: number;
  authorName: string | null;
  authorHandle: string | null;
  body: string;
  createdAt: string;
};

export type DiscussionDetail = DiscussionSummary & {
  posts: DiscussionPost[];
};
