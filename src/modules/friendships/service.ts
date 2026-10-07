import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';

import {
  deletePendingRequest,
  findFriendshipBetween,
  findFriendshipById,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  searchUsers as searchUsersRepository,
  setFriendshipStatus,
  upsertFriendshipRequest,
  userExists,
} from './repository';
import type {
  CreateFriendRequestInput,
  FriendshipDecisionInput,
  UserSearchInput,
} from './schema';
import type {
  FriendRequestSummary,
  Friendship,
  SocialUser,
  UserSearchResult,
} from './types';

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

export async function searchUsers(
  actor: Actor,
  input: UserSearchInput,
): Promise<Result<UserSearchResult[]>> {
  return ok(await searchUsersRepository(actor.id, input.q));
}

export async function createFriendRequest(
  actor: Actor,
  input: CreateFriendRequestInput,
): Promise<Result<Friendship>> {
  if (input.addresseeId === actor.id) {
    return err('FORBIDDEN', 'Нельзя отправить заявку самому себе');
  }
  if (!(await userExists(input.addresseeId))) {
    return err('NOT_FOUND', 'Пользователь не найден');
  }
  const existing = await findFriendshipBetween(actor.id, input.addresseeId);
  if (existing) {
    if (existing.status === 'accepted') {
      return err('CONFLICT', 'Вы уже друзья');
    }
    if (existing.status === 'pending') {
      return err('CONFLICT', 'Заявка уже отправлена');
    }
  }
  return withTransaction(async (tx) =>
    ok(await upsertFriendshipRequest(tx, actor.id, input.addresseeId)),
  );
}

export async function withdrawFriendRequest(
  actor: Actor,
  input: FriendshipDecisionInput,
): Promise<Result<Friendship>> {
  const friendship = await findFriendshipById(input.friendshipId);
  if (!friendship) {
    return err('NOT_FOUND', 'Заявка не найдена');
  }
  if (friendship.requesterId !== actor.id) {
    return err('FORBIDDEN', 'Нет прав');
  }
  const deleted = await deletePendingRequest(friendship.id, actor.id);
  if (!deleted) {
    return err('CONFLICT', 'Заявка уже обработана');
  }
  return ok(deleted);
}
