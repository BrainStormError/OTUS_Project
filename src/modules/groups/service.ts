import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';

import {
  findGroupById,
  insertGroupMember,
  listDiscoverableGroups,
  listGroupsForUser,
} from './repository';
import type { JoinGroupInput } from './schema';
import type { GroupSummary } from './types';

export async function getGroups(actor: Actor): Promise<Result<GroupSummary[]>> {
  return ok(await listGroupsForUser(actor.id));
}

export async function getDiscoverableGroups(
  actor: Actor,
): Promise<Result<GroupSummary[]>> {
  return ok(await listDiscoverableGroups(actor.id));
}

export async function getGroup(groupId: string): Promise<Result<GroupSummary>> {
  const group = await findGroupById(groupId);
  if (!group) {
    return err('NOT_FOUND', 'Группа не найдена');
  }
  return ok(group);
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
      targetType: 'group',
      targetId: input.groupId,
      payload: { href: `/groups/${input.groupId}` },
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
