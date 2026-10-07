import { z } from 'zod';

const id = z.coerce.number().int().positive();

export const createDiscussionInput = z.object({
  groupId: id,
  title: z.string().trim().min(1).max(1000),
  mediaId: id.optional(),
});

export type CreateDiscussionInput = z.infer<typeof createDiscussionInput>;

export const createPostInput = z.object({
  discussionId: id,
  body: z.string().trim().min(1).max(1000),
});

export type CreatePostInput = z.infer<typeof createPostInput>;

export const attachDiscussionInput = z.object({
  groupId: id,
  mediaId: id,
  title: z.string().trim().min(1).max(1000),
});

export type AttachDiscussionInput = z.infer<typeof attachDiscussionInput>;
