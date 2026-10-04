import { z } from 'zod';

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

export const listDirectoryInput = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().trim().min(1).max(512).optional(),
});

export type ListDirectoryInput = z.infer<typeof listDirectoryInput>;

export const createEntryInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

export type CreateEntryInput = z.infer<typeof createEntryInput>;
