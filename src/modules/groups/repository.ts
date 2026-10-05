import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { GroupMemberSummary, GroupSummary } from './types';

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  restricted: boolean;
};

type MemberRow = {
  group_id: string;
  id: string;
  name: string | null;
  handle: string | null;
  role: 'admin' | 'member';
};

const GROUP_COLUMNS = 'id, name, description, tags, restricted';

async function membersByGroup(groupIds: string[]): Promise<Map<string, GroupMemberSummary[]>> {
  const map = new Map<string, GroupMemberSummary[]>();
  if (groupIds.length === 0) {
    return map;
  }
  const rows = await query<MemberRow>(
    `SELECT gm.group_id, u.id, u.name, u.handle, gm.role
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ANY($1::uuid[])
      ORDER BY u.name NULLS LAST, u.id`,
    [groupIds],
  );
  for (const row of rows) {
    const list = map.get(row.group_id) ?? [];
    list.push({
      id: row.id,
      name: row.name ?? 'Пользователь',
      handle: row.handle ?? row.id.slice(0, 8),
      role: row.role,
    });
    map.set(row.group_id, list);
  }
  return map;
}

function mapGroup(row: GroupRow, members: GroupMemberSummary[]): GroupSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: row.tags,
    restricted: row.restricted,
    members,
  };
}

export async function listGroupsForUser(userId: string): Promise<GroupSummary[]> {
  const rows = await query<GroupRow>(
    `SELECT g.${GROUP_COLUMNS.split(', ').join(', g.')}
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = $1
      ORDER BY g.name`,
    [userId],
  );
  const members = await membersByGroup(rows.map((row) => row.id));
  return rows.map((row) => mapGroup(row, members.get(row.id) ?? []));
}

export async function listDiscoverableGroups(userId: string): Promise<GroupSummary[]> {
  const rows = await query<GroupRow>(
    `SELECT g.${GROUP_COLUMNS.split(', ').join(', g.')}
       FROM groups g
      WHERE g.restricted = false
        AND NOT EXISTS (
          SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $1
        )
      ORDER BY g.name`,
    [userId],
  );
  const members = await membersByGroup(rows.map((row) => row.id));
  return rows.map((row) => mapGroup(row, members.get(row.id) ?? []));
}

export async function findGroupById(id: string): Promise<GroupSummary | null> {
  const rows = await query<GroupRow>(`SELECT ${GROUP_COLUMNS} FROM groups WHERE id = $1`, [id]);
  const row = rows[0];
  if (!row) {
    return null;
  }
  const members = await membersByGroup([row.id]);
  return mapGroup(row, members.get(row.id) ?? []);
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
     ) AS exists`,
    [groupId, userId],
  );
  return rows[0]?.exists === true;
}

export async function insertGroupMember(
  tx: PoolClient,
  groupId: string,
  userId: string,
  role: 'admin' | 'member' = 'member',
): Promise<boolean> {
  const result = await tx.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId, role],
  );
  return (result.rowCount ?? 0) > 0;
}
