import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type {
  GroupInvitation,
  GroupInvitationStatus,
  GroupMemberSummary,
  GroupSummary,
} from './types';

const ROLE_CODE = { member: 0, admin: 1 } as const;

function roleFromCode(code: number): 'admin' | 'member' {
  return code === 1 ? 'admin' : 'member';
}

const INVITATION_STATUS_CODE: Record<GroupInvitationStatus, number> = {
  pending: 0,
  accepted: 1,
  declined: 2,
};

const INVITATION_STATUS_NAME: Record<number, GroupInvitationStatus> = {
  0: 'pending',
  1: 'accepted',
  2: 'declined',
};

function invitationStatusFromCode(code: number): GroupInvitationStatus {
  return INVITATION_STATUS_NAME[code] ?? 'pending';
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

type InvitationRow = {
  id: number;
  group_id: number;
  group_name: string;
  inviter_id: number;
  inviter_name: string | null;
  inviter_handle: string | null;
  invitee_id: number;
  invitee_name: string | null;
  invitee_handle: string | null;
  status: number;
  created_at: Date;
};

const GROUP_SELECT = `g.id, g.name, g.description, g.restricted,
  COALESCE((SELECT array_agg(t.name ORDER BY t.id) FROM tags t WHERE t.id = ANY(g.tag_ids)), '{}') AS tags`;

const INVITATION_COLUMNS = `i.id, i.group_id, g.name AS group_name,
  i.inviter_id, u.name AS inviter_name, u.handle AS inviter_handle,
  i.invitee_id, iu.name AS invitee_name, iu.handle AS invitee_handle,
  i.status, i.created_at`;

const INVITATION_JOINS = `JOIN groups g ON g.id = i.group_id
  JOIN users u ON u.id = i.inviter_id
  JOIN users iu ON iu.id = i.invitee_id`;

function mapInvitation(row: InvitationRow): GroupInvitation {
  return {
    id: row.id,
    groupId: row.group_id,
    groupName: row.group_name,
    inviterId: row.inviter_id,
    inviterName: row.inviter_name ?? 'Пользователь',
    inviterHandle: row.inviter_handle ?? String(row.inviter_id),
    inviteeId: row.invitee_id,
    inviteeName: row.invitee_name ?? 'Пользователь',
    inviteeHandle: row.invitee_handle ?? String(row.invitee_id),
    status: invitationStatusFromCode(row.status),
    createdAt: row.created_at.toISOString(),
  };
}

async function executor<T extends Record<string, unknown>>(
  client: PoolClient | undefined,
  sql: string,
  params: unknown[],
): Promise<T[]> {
  if (client) {
    const result = await client.query(sql, params);
    return result.rows as T[];
  }
  return query<T>(sql, params);
}

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

export async function userExists(userId: number): Promise<boolean> {
  const rows = await query<{ id: number }>('SELECT id FROM users WHERE id = $1', [userId]);
  return rows.length > 0;
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

// Resolves free-form tag names to dictionary codes, matching without regard to
// case. The stored text keeps the original case of the first value seen.
export async function resolveTagIds(tx: PoolClient, names: string[]): Promise<number[]> {
  const seen = new Set<string>();
  const ids: number[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) {
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const result = await tx.query<{ id: number }>(
      `INSERT INTO tags (name) VALUES ($1)
       ON CONFLICT ((lower(name))) DO UPDATE SET name = tags.name
       RETURNING id`,
      [name],
    );
    const row = result.rows[0];
    if (row) {
      ids.push(row.id);
    }
  }
  return ids;
}

export async function insertGroup(
  tx: PoolClient,
  input: {
    name: string;
    description: string | null;
    restricted: boolean;
    tagIds: number[];
  },
): Promise<number> {
  const result = await tx.query<{ id: number }>(
    `INSERT INTO groups (name, description, restricted, tag_ids)
     VALUES ($1, $2, $3, $4::smallint[])
     RETURNING id`,
    [input.name, input.description, input.restricted, input.tagIds],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('insertGroup returned no row');
  }
  return row.id;
}

export async function updateGroupRow(
  tx: PoolClient,
  groupId: number,
  patch: {
    name?: string;
    description?: string;
    restricted?: boolean;
    tagIds?: number[];
  },
): Promise<boolean> {
  const result = await tx.query(
    `UPDATE groups
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            restricted = COALESCE($4, restricted),
            tag_ids = COALESCE($5::smallint[], tag_ids)
      WHERE id = $1`,
    [
      groupId,
      patch.name ?? null,
      patch.description ?? null,
      patch.restricted ?? null,
      patch.tagIds ?? null,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function updateGroupMemberRole(
  tx: PoolClient,
  groupId: number,
  userId: number,
  role: 'admin' | 'member',
): Promise<boolean> {
  const result = await tx.query(
    `UPDATE group_members SET role = $3 WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId, ROLE_CODE[role]],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteGroupMember(
  tx: PoolClient,
  groupId: number,
  userId: number,
): Promise<boolean> {
  const result = await tx.query(
    `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listGroupMemberIds(
  tx: PoolClient,
  groupId: number,
): Promise<number[]> {
  const result = await tx.query<{ user_id: number }>(
    `SELECT user_id FROM group_members WHERE group_id = $1`,
    [groupId],
  );
  return result.rows.map((row) => row.user_id);
}

// Removes the group's activity explicitly: activity_events.group_id is
// ON DELETE SET NULL, so deleting the group alone would leave its events behind
// reclassified as personal/friend activity.
export async function deleteGroupActivity(tx: PoolClient, groupId: number): Promise<void> {
  await tx.query(`DELETE FROM activity_events WHERE group_id = $1`, [groupId]);
}

export async function deleteGroup(tx: PoolClient, groupId: number): Promise<boolean> {
  const result = await tx.query(`DELETE FROM groups WHERE id = $1`, [groupId]);
  return (result.rowCount ?? 0) > 0;
}

export async function countGroupAdmins(
  groupId: number,
  client?: PoolClient,
): Promise<number> {
  const rows = await executor<{ count: string }>(
    client,
    `SELECT count(*)::text AS count FROM group_members WHERE group_id = $1 AND role = $2`,
    [groupId, ROLE_CODE.admin],
  );
  return Number(rows[0]?.count ?? '0');
}

export async function upsertInvitation(
  tx: PoolClient,
  groupId: number,
  inviterId: number,
  inviteeId: number,
): Promise<GroupInvitation> {
  const result = await tx.query<InvitationRow>(
    `WITH upserted AS (
       INSERT INTO group_invitations (group_id, inviter_id, invitee_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (group_id, invitee_id) DO UPDATE
         SET status = EXCLUDED.status,
             inviter_id = EXCLUDED.inviter_id,
             updated_at = now()
       RETURNING *
     )
     SELECT ${INVITATION_COLUMNS}
       FROM upserted i
       ${INVITATION_JOINS}`,
    [groupId, inviterId, inviteeId, INVITATION_STATUS_CODE.pending],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertInvitation returned no row');
  }
  return mapInvitation(row);
}

export async function findInvitationById(id: number): Promise<GroupInvitation | null> {
  const rows = await query<InvitationRow>(
    `SELECT ${INVITATION_COLUMNS}
       FROM group_invitations i
       ${INVITATION_JOINS}
      WHERE i.id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? mapInvitation(row) : null;
}

export async function listPendingInvitationsForUser(
  userId: number,
): Promise<GroupInvitation[]> {
  const rows = await query<InvitationRow>(
    `SELECT ${INVITATION_COLUMNS}
       FROM group_invitations i
       ${INVITATION_JOINS}
      WHERE i.invitee_id = $1 AND i.status = $2
      ORDER BY i.created_at DESC, i.id DESC`,
    [userId, INVITATION_STATUS_CODE.pending],
  );
  return rows.map(mapInvitation);
}

export async function listPendingInvitationsForGroup(
  groupId: number,
): Promise<GroupInvitation[]> {
  const rows = await query<InvitationRow>(
    `SELECT ${INVITATION_COLUMNS}
       FROM group_invitations i
       ${INVITATION_JOINS}
      WHERE i.group_id = $1 AND i.status = $2
      ORDER BY i.created_at DESC, i.id DESC`,
    [groupId, INVITATION_STATUS_CODE.pending],
  );
  return rows.map(mapInvitation);
}

export async function setInvitationStatus(
  tx: PoolClient,
  id: number,
  inviteeId: number,
  status: 'accepted' | 'declined',
): Promise<GroupInvitation | null> {
  const result = await tx.query<InvitationRow>(
    `WITH updated AS (
       UPDATE group_invitations
          SET status = $3, updated_at = now()
        WHERE id = $1 AND invitee_id = $2 AND status = $4
        RETURNING *
     )
     SELECT ${INVITATION_COLUMNS}
       FROM updated i
       ${INVITATION_JOINS}`,
    [id, inviteeId, INVITATION_STATUS_CODE[status], INVITATION_STATUS_CODE.pending],
  );
  const row = result.rows[0];
  return row ? mapInvitation(row) : null;
}

export async function deletePendingInvitation(
  tx: PoolClient,
  id: number,
  groupId: number,
): Promise<boolean> {
  const result = await tx.query(
    `DELETE FROM group_invitations
      WHERE id = $1 AND group_id = $2 AND status = $3`,
    [id, groupId, INVITATION_STATUS_CODE.pending],
  );
  return (result.rowCount ?? 0) > 0;
}
