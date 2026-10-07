import { can, type Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';
import {
  hasGroupRating as hasGroupRatingRepository,
  listGroupRatings as listGroupRatingsRepository,
  saveGroupRating as saveGroupRatingRepository,
  type GroupRatingMember,
  type GroupRatingSummary,
} from '@/modules/ratings';

import {
  findGroupById,
  getGroupRole as getGroupRoleRepository,
  insertGroupMember,
  listDiscoverableGroups,
  listGroupsForUser,
} from './repository';
import type { GroupRatingInput, JoinGroupInput } from './schema';
import type { GroupSummary } from './types';

export async function getGroups(actor: Actor): Promise<Result<GroupSummary[]>> {
  return ok(await listGroupsForUser(actor.id));
}

export async function getDiscoverableGroups(actor: Actor): Promise<Result<GroupSummary[]>> {
  return ok(await listDiscoverableGroups(actor.id));
}

export async function getGroup(groupId: number): Promise<Result<GroupSummary>> {
  const group = await findGroupById(groupId);
  if (!group) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  return ok(group);
}

export async function getGroupRole(
  groupId: number,
  userId: number,
): Promise<'admin' | 'member' | null> {
  return getGroupRoleRepository(groupId, userId);
}

export async function hasGroupRating(groupId: number, mediaId: number): Promise<boolean> {
  return hasGroupRatingRepository(groupId, mediaId);
}

export async function joinGroup(
  actor: Actor,
  input: JoinGroupInput,
): Promise<Result<GroupSummary>> {
  const group = await findGroupById(input.groupId);
  if (!group) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  if (group.restricted) {
    return err('FORBIDDEN', 'Закрытая группа — только по приглашению');
  }

  const joined = await withTransaction(async (tx) => {
    const inserted = await insertGroupMember(tx, input.groupId, actor.id);
    if (!inserted) {
      return false;
    }
    await recordEvent(tx, {
      actorId: actor.id,
      kind: 'group_joined',
      groupId: input.groupId,
    });
    return true;
  });

  if (!joined) {
    return err('CONFLICT', 'Вы уже участник группы');
  }

  const updated = await findGroupById(input.groupId);
  if (!updated) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  return ok(updated);
}

export async function saveGroupRating(
  actor: Actor,
  input: GroupRatingInput,
): Promise<Result<GroupRatingMember>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:rate', { groupRole: role })) {
    return err('FORBIDDEN', 'Оценивать медиа могут только участники группы');
  }

  return withTransaction(async (tx) => {
    const rating = await saveGroupRatingRepository(tx, actor.id, input.groupId, input);
    await recordEvent(tx, {
      actorId: actor.id,
      kind: input.mediaKind === 'film' ? 'film_rated' : 'series_rated',
      groupId: input.groupId,
      mediaId: rating.mediaId,
    });
    return ok(rating);
  });
}

export async function listGroupRatings(
  groupId: number,
): Promise<Result<GroupRatingSummary[]>> {
  return ok(await listGroupRatingsRepository(groupId));
}
