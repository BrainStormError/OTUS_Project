import { z } from 'zod';

import { ratingInput } from '@/modules/ratings';

const id = z.coerce.number().int().positive();

export const joinGroupInput = z.object({
  groupId: id,
});

export type JoinGroupInput = z.infer<typeof joinGroupInput>;

export const groupRatingInput = ratingInput.extend({
  groupId: id,
});

export type GroupRatingInput = z.infer<typeof groupRatingInput>;
