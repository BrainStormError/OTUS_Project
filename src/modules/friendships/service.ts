import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';

import {
  findFriendshipById,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  setFriendshipStatus,
} from './repository';
import type { FriendshipDecisionInput } from './schema';
import type { FriendRequestSummary, Friendship, SocialUser } from './types';

export async function acceptFriendship(
  actor: Actor,
  input: FriendshipDecisionInput,
): Promise<Result<Friendship>> {
  const friendship = await findFriendshipById(input.friendshipId);
  if (!friendship) {
    return err('NOT_FOUND', 'Заявка не найдена');
  }
  if (friendship.addresseeId !== actor.id) {
    return err('FORBIDDEN', 'Нет прав');
  }

  return withTransaction(async (tx) => {
    const updated = await setFriendshipStatus(tx, input.friendshipId, actor.id, 'accepted');
    if (!updated) {
      return err('CONFLICT', 'Заявка уже обработана');
    }
    await recordEvent(tx, {
      actorId: actor.id,
      kind: 'friendship_accepted',
      targetType: 'user',
      targetId: friendship.requesterId,
    });
    return ok(updated);
  });
}

export async function declineFriendship(
  actor: Actor,
  input: FriendshipDecisionInput,
): Promise<Result<Friendship>> {
  const friendship = await findFriendshipById(input.friendshipId);
  if (!friendship) {
    return err('NOT_FOUND', 'Заявка не найдена');
  }
  if (friendship.addresseeId !== actor.id) {
    return err('FORBIDDEN', 'Нет прав');
  }

  return withTransaction(async (tx) => {
    const updated = await setFriendshipStatus(tx, input.friendshipId, actor.id, 'declined');
    if (!updated) {
      return err('CONFLICT', 'Заявка уже обработана');
    }
    return ok(updated);
  });
}

export async function getFriends(actor: Actor): Promise<Result<SocialUser[]>> {
  return ok(await listFriends(actor.id));
}

export async function getIncomingRequests(
  actor: Actor,
): Promise<Result<FriendRequestSummary[]>> {
  return ok(await listIncomingRequests(actor.id));
}

export async function getOutgoingRequests(
  actor: Actor,
): Promise<Result<FriendRequestSummary[]>> {
  return ok(await listOutgoingRequests(actor.id));
}
