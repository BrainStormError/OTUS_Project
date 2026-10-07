import { z } from 'zod';

export const mediaKinds = ['film', 'series'] as const;

export const ratingInput = z.object({
  mediaKind: z.enum(mediaKinds),
  mediaRef: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(1000),
  year: z.coerce.number().int().min(1800).max(2200).optional(),
  genres: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  rating: z.coerce.number().min(0).max(10),
  comment: z.string().trim().max(1000).optional(),
  watchedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type RatingInput = z.infer<typeof ratingInput>;
