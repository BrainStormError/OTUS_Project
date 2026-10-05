import { z } from 'zod';

export const MAX_FEED_LIMIT = 50;
export const DEFAULT_FEED_LIMIT = 20;

export const listFeedInput = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_FEED_LIMIT).default(DEFAULT_FEED_LIMIT),
  cursor: z.string().trim().min(1).max(512).optional(),
  since: z.string().trim().min(1).max(512).optional(),
});

export type ListFeedInput = z.infer<typeof listFeedInput>;
