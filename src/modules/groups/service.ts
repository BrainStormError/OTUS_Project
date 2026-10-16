import { cache } from 'react';

import { can, type Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';
import { resolveSaveMetadata } from '@/modules/catalog';
import {
  findMediaId,
  hasGroupRating as hasGroupRatingRepository,
  hasPersonalRating,
  listGroupRatings as listGroupRatingsRepository,
  saveGroupRating as saveGroupRatingRepository,
  savePersonalRating,
  type GroupRatingMember,
  type GroupRatingSummary,
} from '@/modules/ratings';
import { removeWatchlistForMedia } from '@/modules/watchlist';

import {
  countGroupAdmins,
  deleteGroup,
  deleteGroupActivity,
  deleteGroupMember,
  deletePendingInvitation,
  findGroupById,
  findInvitationById,
  getGroupRole as getGroupRoleRepository,
  insertGroup,
  insertGroupMember,
  isGroupMember,
  listDiscoverableGroups,
  listGroupsForUser,
  listPendingInvitationsForGroup,
  listPendingInvitationsForUser,
  resolveTagIds,
  setInvitationStatus,
  updateGroupMemberRole,
  updateGroupRow,
  upsertInvitation,
  userExists,
} from './repository';
import type {
  CreateGroupInput,
  DissolveGroupInput,
  GroupRatingInput,
  GroupRoleInput,
  InviteToGroupInput,
  JoinGroupInput,
  LeaveGroupInput,
  RemoveGroupMemberInput,
  RespondInvitationInput,
  UpdateGroupInput,
} from './schema';
import type { GroupInvitation, GroupSummary } from './types';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505'
  );
}

function cleanDescription(description: string | undefined): string | null {
  return description && description.length > 0 ? description : null;
}

// The group context is read by many layers of a single server render
// (GroupPage, getGroup, canViewGroup, and the panel services). Memoizing the
// reads per server request keeps each of them calling the same functions while
// performing the SQL once, the same way getActor is memoized.
const findGroupByIdForRequest = cache(findGroupById);
const getGroupRoleForRequest = cache(getGroupRoleRepository);

export async function getGroups(actor: Actor): Promise<Result<GroupSummary[]>> {
  return ok(await listGroupsForUser(actor.id));
}

export async function getDiscoverableGroups(actor: Actor): Promise<Result<GroupSummary[]>> {
  return ok(await listDiscoverableGroups(actor.id));
}

export async function getGroup(
  actor: Actor | null,
  groupId: number,
): Promise<Result<GroupSummary>> {
  if (!(await canViewGroup(actor, groupId))) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  const group = await findGroupByIdForRequest(groupId);
  if (!group) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  return ok(group);
}

export async function getGroupRole(
  groupId: number,
  userId: number,
): Promise<'admin' | 'member' | null> {
  return getGroupRoleForRequest(groupId, userId);
}

export async function canViewGroup(
  actor: Actor | null,
  groupId: number,
): Promise<boolean> {
  if (!actor) {
    return false;
  }
  const group = await findGroupByIdForRequest(groupId);
  if (!group) {
    return false;
  }
  const role = await getGroupRoleForRequest(groupId, actor.id);
  return can(actor, 'group:view', { groupRole: role, restricted: group.restricted });
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

export async function leaveGroup(
  actor: Actor,
  input: LeaveGroupInput,
): Promise<Result<null>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:leave', { groupRole: role })) {
    return err('FORBIDDEN', 'Покинуть группу может только участник, не администратор');
  }

  return withTransaction(async (tx) => {
    const removed = await deleteGroupMember(tx, input.groupId, actor.id);
    if (!removed) {
      return err('NOT_FOUND', 'Участник не найден');
    }
    return ok(null);
  });
}

export async function createGroup(
  actor: Actor,
  input: CreateGroupInput,
): Promise<Result<GroupSummary>> {
  if (!can(actor, 'group:create')) {
    return err('FORBIDDEN', 'Нет прав');
  }

  try {
    const groupId = await withTransaction(async (tx) => {
      const tagIds = input.tags ? await resolveTagIds(tx, input.tags) : [];
      const id = await insertGroup(tx, {
        name: input.name,
        description: cleanDescription(input.description),
        restricted: input.restricted ?? false,
        tagIds,
      });
      await insertGroupMember(tx, id, actor.id, 'admin');
      return id;
    });

    const group = await findGroupById(groupId);
    if (!group) {
      return err('INTERNAL', 'Не удалось создать группу');
    }
    return ok(group);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return err('CONFLICT', 'Группа с таким названием уже существует');
    }
    throw error;
  }
}

export async function updateGroup(
  actor: Actor,
  input: UpdateGroupInput,
): Promise<Result<GroupSummary>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:update', { groupRole: role })) {
    return err('FORBIDDEN', 'Редактировать группу может только администратор');
  }

  try {
    await withTransaction(async (tx) => {
      const tagIds = input.tags ? await resolveTagIds(tx, input.tags) : undefined;
      await updateGroupRow(tx, input.groupId, {
        name: input.name,
        description: input.description,
        restricted: input.restricted,
        tagIds,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return err('CONFLICT', 'Группа с таким названием уже существует');
    }
    throw error;
  }

  const group = await findGroupById(input.groupId);
  if (!group) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  return ok(group);
}

export async function changeGroupRole(
  actor: Actor,
  input: GroupRoleInput,
): Promise<Result<null>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:manage', { groupRole: role })) {
    return err('FORBIDDEN', 'Управлять участниками может только администратор');
  }

  return withTransaction(async (tx) => {
    if (input.role === 'member') {
      const targetRole = await getGroupRoleRepository(input.groupId, input.userId);
      if (targetRole === 'admin' && (await countGroupAdmins(input.groupId, tx)) <= 1) {
        return err('CONFLICT', 'Нельзя понизить последнего администратора');
      }
    }
    const updated = await updateGroupMemberRole(tx, input.groupId, input.userId, input.role);
    if (!updated) {
      return err('NOT_FOUND', 'Участник не найден');
    }
    return ok(null);
  });
}

export async function removeGroupMember(
  actor: Actor,
  input: RemoveGroupMemberInput,
): Promise<Result<null>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:manage', { groupRole: role })) {
    return err('FORBIDDEN', 'Управлять участниками может только администратор');
  }

  return withTransaction(async (tx) => {
    if (input.userId === actor.id) {
      return err('FORBIDDEN', 'Нельзя удалить себя из группы');
    }
    const targetRole = await getGroupRoleRepository(input.groupId, input.userId);
    if (targetRole === 'admin' && (await countGroupAdmins(input.groupId, tx)) <= 1) {
      return err('CONFLICT', 'Нельзя удалить последнего администратора');
    }
    const removed = await deleteGroupMember(tx, input.groupId, input.userId);
    if (!removed) {
      return err('NOT_FOUND', 'Участник не найден');
    }
    return ok(null);
  });
}

export async function dissolveGroup(
  actor: Actor,
  input: DissolveGroupInput,
): Promise<Result<null>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:delete', { groupRole: role })) {
    return err('FORBIDDEN', 'Распустить группу может только администратор');
  }

  return withTransaction(async (tx) => {
    await deleteGroupActivity(tx, input.groupId);
    const removed = await deleteGroup(tx, input.groupId);
    if (!removed) {
      return err('NOT_FOUND', 'Группа не найдена');
    }
    return ok(null);
  });
}

export async function inviteToGroup(
  actor: Actor,
  input: InviteToGroupInput,
): Promise<Result<GroupInvitation>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:invite', { groupRole: role })) {
    return err('FORBIDDEN', 'Приглашать может только администратор группы');
  }
  if (!(await userExists(input.inviteeId))) {
    return err('NOT_FOUND', 'Пользователь не найден');
  }
  if (await isGroupMember(input.groupId, input.inviteeId)) {
    return err('CONFLICT', 'Пользователь уже участник группы');
  }

  return withTransaction(async (tx) =>
    ok(await upsertInvitation(tx, input.groupId, actor.id, input.inviteeId)),
  );
}

export async function listMyInvitations(actor: Actor): Promise<Result<GroupInvitation[]>> {
  return ok(await listPendingInvitationsForUser(actor.id));
}

export async function listGroupInvitations(
  actor: Actor,
  groupId: number,
): Promise<Result<GroupInvitation[]>> {
  const role = await getGroupRoleRepository(groupId, actor.id);
  if (!can(actor, 'group:invite', { groupRole: role })) {
    return err('FORBIDDEN', 'Нет прав');
  }
  return ok(await listPendingInvitationsForGroup(groupId));
}

export async function respondInvitation(
  actor: Actor,
  input: RespondInvitationInput,
): Promise<Result<GroupInvitation>> {
  const invitation = await findInvitationById(input.invitationId);
  if (!invitation) {
    return err('NOT_FOUND', 'Приглашение не найдено');
  }
  if (invitation.inviteeId !== actor.id) {
    return err('FORBIDDEN', 'Нет прав');
  }
  if (invitation.status !== 'pending') {
    return err('CONFLICT', 'Приглашение уже обработано');
  }

  if (input.decision === 'decline') {
    return withTransaction(async (tx) => {
      const updated = await setInvitationStatus(tx, invitation.id, actor.id, 'declined');
      if (!updated) {
        return err('CONFLICT', 'Приглашение уже обработано');
      }
      return ok(updated);
    });
  }

  return withTransaction(async (tx) => {
    const updated = await setInvitationStatus(tx, invitation.id, actor.id, 'accepted');
    if (!updated) {
      return err('CONFLICT', 'Приглашение уже обработано');
    }
    await insertGroupMember(tx, updated.groupId, actor.id, 'member');
    await recordEvent(tx, {
      actorId: actor.id,
      kind: 'group_joined',
      groupId: updated.groupId,
    });
    return ok(updated);
  });
}

export async function cancelInvitation(
  actor: Actor,
  input: { invitationId: number },
): Promise<Result<null>> {
  const invitation = await findInvitationById(input.invitationId);
  if (!invitation) {
    return err('NOT_FOUND', 'Приглашение не найдено');
  }
  const role = await getGroupRoleRepository(invitation.groupId, actor.id);
  if (!can(actor, 'group:invite', { groupRole: role })) {
    return err('FORBIDDEN', 'Нет прав');
  }

  return withTransaction(async (tx) => {
    const deleted = await deletePendingInvitation(tx, invitation.id, invitation.groupId);
    if (!deleted) {
      return err('CONFLICT', 'Приглашение уже обработано');
    }
    return ok(null);
  });
}

export async function saveGroupRating(
  actor: Actor,
  input: GroupRatingInput,
): Promise<Result<GroupRatingMember>> {
  const role = await getGroupRoleRepository(input.groupId, actor.id);
  if (!can(actor, 'group:rate', { groupRole: role })) {
    return err('FORBIDDEN', 'Оценивать медиа могут только участники группы');
  }

  const metadata = await resolveSaveMetadata(input.mediaKind, input.mediaRef);
  if (!metadata.ok) {
    return metadata;
  }

  const canStart = can(actor, 'group:rate:start', { groupRole: role });
  const alsoPersonal = input.alsoPersonal === true;
  const confirmOverwrite = input.confirmOverwrite === true;

  return withTransaction(async (tx) => {
    if (alsoPersonal && !confirmOverwrite) {
      const existingMediaId = await findMediaId(tx, input.mediaKind, input.mediaRef);
      if (
        existingMediaId !== null &&
        (await hasPersonalRating(tx, actor.id, existingMediaId))
      ) {
        return err('CONFLICT', 'У вас уже есть личная оценка — подтвердите перезапись');
      }
    }

    const rating = await saveGroupRatingRepository(
      tx,
      actor.id,
      input.groupId,
      input,
      metadata.value,
      canStart,
    );
    if (!rating) {
      return err('FORBIDDEN', 'Начать оценивание медиа может только администратор группы');
    }

    if (alsoPersonal) {
      await savePersonalRating(tx, actor.id, input, metadata.value);
      await removeWatchlistForMedia(tx, actor.id, rating.mediaId);
    }

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
  actor: Actor | null,
  groupId: number,
): Promise<Result<GroupRatingSummary[]>> {
  if (!(await canViewGroup(actor, groupId))) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  return ok(await listGroupRatingsRepository(groupId));
}
