import { z } from 'zod';

import { mediaKinds } from '@/modules/ratings';

export const addWatchlistInput = z
  .object({
    mediaKind: z.enum(mediaKinds),
    mediaRef: z.string().trim().min(1).max(128),
  })
  .strict();

export type AddWatchlistInput = z.infer<typeof addWatchlistInput>;
