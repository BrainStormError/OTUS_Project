import { z } from 'zod';

export const upsertWatchedRecordInput = z.object({
  mediaKind: z.enum(['film', 'series']),
  mediaRef: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(300),
  year: z.coerce.number().int().min(1800).max(2200).optional(),
  genres: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  rating: z.coerce.number().min(0).max(10),
  comment: z.string().trim().max(2000).optional(),
  watchedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type UpsertWatchedRecordInput = z.infer<typeof upsertWatchedRecordInput>;
