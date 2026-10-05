import { z } from 'zod';

export const friendshipDecisionInput = z.object({
  friendshipId: z.string().uuid(),
});

export type FriendshipDecisionInput = z.infer<typeof friendshipDecisionInput>;
