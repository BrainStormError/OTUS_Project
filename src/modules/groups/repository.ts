import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { GroupMemberSummary, GroupSummary } from './types';

const ROLE_CODE = { member: 0, admin: 1 } as const;

function roleFromCode(code: number): 'admin' | 'member' {
  return code === 1 ? 'admin' : 'member';
}

type GroupRow = {
  id: number;
  name: string;
  description: string | null;
  tags: string[] | null;
  restricted: boolean;
};

type MemberRow = {
  group_id: number;
  id: number;
  name: string | null;
  handle: string | null;
  role: number;
};

const GROUP_SELECT = `g.id, g.name, g.description, g.restricted,
  COALESCE((SELECT array_agg(t.name ORDER BY t.id) FROM tags t WHERE t.id = ANY(g.tag_ids)), '{}') AS tags`;

async function membersByGroup(
  groupIds: number[],
): Promise<Map<number, GroupMemberSummary[]>> {
  const map = new Map<number, GroupMemberSummary[]>();
  if (groupIds.length === 0) {
    return map;
  }
  const rows = await query<MemberRow>(
    `SELECT gm.group_id, u.id, u.name, u.handle, gm.role
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ANY($1::bigint[])
      ORDER BY u.name NULLS LAST, u.id`,
    [groupIds],
  );
  for (const row of rows) {
    const list = map.get(row.group_id) ?? [];
    list.push({
      id: row.id,
      name: row.name ?? 'Пользователь',
      handle: row.handle ?? String(row.id),
      role: roleFromCode(row.role),
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
    tags: row.tags ?? [],
    restricted: row.restricted,
    members,
  };
}

export async function listGroupsForUser(userId: number): Promise<GroupSummary[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT}
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = $1
      ORDER BY g.name`,
    [userId],
  );
  const members = await membersByGroup(rows.map((row) => row.id));
  return rows.map((row) => mapGroup(row, members.get(row.id) ?? []));
}

export async function listDiscoverableGroups(userId: number): Promise<GroupSummary[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT}
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

export async function findGroupById(id: number): Promise<GroupSummary | null> {
  const rows = await query<GroupRow>(`SELECT ${GROUP_SELECT} FROM groups g WHERE g.id = $1`, [id]);
  const row = rows[0];
  if (!row) {
    return null;
  }
  const members = await membersByGroup([row.id]);
  return mapGroup(row, members.get(row.id) ?? []);
}

export async function isGroupMember(groupId: number, userId: number): Promise<boolean> {
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
  groupId: number,
  userId: number,
  role: 'admin' | 'member' = 'member',
): Promise<boolean> {
  const result = await tx.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId, ROLE_CODE[role]],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getGroupRole(
  groupId: number,
  userId: number,
): Promise<'admin' | 'member' | null> {
  const rows = await query<{ role: number }>(
    `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );
  const row = rows[0];
  return row ? roleFromCode(row.role) : null;
}
