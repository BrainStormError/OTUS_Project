import { z } from 'zod';

const id = z.coerce.number().int().positive();

export const friendshipDecisionInput = z.object({
  friendshipId: id,
});

export type FriendshipDecisionInput = z.infer<typeof friendshipDecisionInput>;

export const removeFriendInput = z.object({
  friendshipId: id,
});

export type RemoveFriendInput = z.infer<typeof removeFriendInput>;

export const userSearchInput = z.object({
  q: z.string().trim().min(1).max(100),
});

export type UserSearchInput = z.infer<typeof userSearchInput>;

export const createFriendRequestInput = z.object({
  addresseeId: id,
});

export type CreateFriendRequestInput = z.infer<typeof createFriendRequestInput>;
