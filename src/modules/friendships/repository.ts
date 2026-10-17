import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type {
  FriendEntry,
  FriendRequestSummary,
  Friendship,
  UserSearchResult,
} from './types';

const STATUS_CODE: Record<Friendship['status'], number> = {
  pending: 0,
  accepted: 1,
  declined: 2,
};

const STATUS_NAME: Record<number, Friendship['status']> = {
  0: 'pending',
  1: 'accepted',
  2: 'declined',
};

function statusFromCode(code: number): Friendship['status'] {
  return STATUS_NAME[code] ?? 'pending';
}

type FriendshipRow = {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: number;
  created_at: Date;
  updated_at: Date;
};

type RequestRow = {
  id: number;
  id_user: number;
  name: string | null;
  handle: string | null;
};

const COLUMNS = 'id, requester_id, addressee_id, status, created_at, updated_at';

function mapFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: statusFromCode(row.status),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapRequest(row: RequestRow): FriendRequestSummary {
  return {
    id: row.id,
    user: {
      id: row.id_user,
      name: row.name ?? 'Пользователь',
      handle: row.handle ?? String(row.id_user),
    },
  };
}

export async function findFriendshipById(id: number): Promise<Friendship | null> {
  const rows = await query<FriendshipRow>(`SELECT ${COLUMNS} FROM friendships WHERE id = $1`, [
    id,
  ]);
  const row = rows[0];
  return row ? mapFriendship(row) : null;
}

export async function setFriendshipStatus(
  tx: PoolClient,
  id: number,
  addresseeId: number,
  status: 'accepted' | 'declined',
): Promise<Friendship | null> {
  const result = await tx.query<FriendshipRow>(
    `UPDATE friendships
        SET status = $3, updated_at = now()
      WHERE id = $1 AND addressee_id = $2 AND status = $4
      RETURNING ${COLUMNS}`,
    [id, addresseeId, STATUS_CODE[status], STATUS_CODE.pending],
  );
  const row = result.rows[0];
  return row ? mapFriendship(row) : null;
}

export async function listFriends(userId: number): Promise<FriendEntry[]> {
  const rows = await query<{
    friendship_id: number;
    id: number;
    name: string | null;
    handle: string | null;
  }>(
    `SELECT f.id AS friendship_id, u.id, u.name, u.handle
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
      WHERE f.status = $2
        AND (f.requester_id = $1 OR f.addressee_id = $1)
        AND u.profile_hidden = false
      ORDER BY u.name NULLS LAST, u.id`,
    [userId, STATUS_CODE.accepted],
  );
  return rows.map((row) => ({
    friendshipId: row.friendship_id,
    user: {
      id: row.id,
      name: row.name ?? 'Пользователь',
      handle: row.handle ?? String(row.id),
    },
  }));
}

export async function listIncomingRequests(userId: number): Promise<FriendRequestSummary[]> {
  const rows = await query<RequestRow>(
    `SELECT f.id, u.id AS id_user, u.name, u.handle
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = $1 AND f.status = $2
      ORDER BY f.created_at DESC`,
    [userId, STATUS_CODE.pending],
  );
  return rows.map(mapRequest);
}

export async function listOutgoingRequests(userId: number): Promise<FriendRequestSummary[]> {
  const rows = await query<RequestRow>(
    `SELECT f.id, u.id AS id_user, u.name, u.handle
       FROM friendships f
       JOIN users u ON u.id = f.addressee_id
      WHERE f.requester_id = $1 AND f.status = $2
      ORDER BY f.created_at DESC`,
    [userId, STATUS_CODE.pending],
  );
  return rows.map(mapRequest);
}

export async function userExists(userId: number): Promise<boolean> {
  const rows = await query<{ id: number }>('SELECT id FROM users WHERE id = $1', [userId]);
  return rows.length > 0;
}

export async function findFriendshipBetween(
  userId: number,
  otherUserId: number,
): Promise<Friendship | null> {
  const rows = await query<FriendshipRow>(
    `SELECT ${COLUMNS} FROM friendships
      WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)`,
    [userId, otherUserId],
  );
  const row = rows[0];
  return row ? mapFriendship(row) : null;
}

export async function upsertFriendshipRequest(
  tx: PoolClient,
  requesterId: number,
  addresseeId: number,
): Promise<Friendship> {
  const result = await tx.query<FriendshipRow>(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id)) DO UPDATE
       SET requester_id = EXCLUDED.requester_id,
           addressee_id = EXCLUDED.addressee_id,
           status = EXCLUDED.status,
           updated_at = now()
     RETURNING ${COLUMNS}`,
    [requesterId, addresseeId, STATUS_CODE.pending],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertFriendshipRequest returned no row');
  }
  return mapFriendship(row);
}

export async function deletePendingRequest(
  id: number,
  requesterId: number,
): Promise<Friendship | null> {
  const rows = await query<FriendshipRow>(
    `DELETE FROM friendships
      WHERE id = $1 AND requester_id = $2 AND status = $3
      RETURNING ${COLUMNS}`,
    [id, requesterId, STATUS_CODE.pending],
  );
  const row = rows[0];
  return row ? mapFriendship(row) : null;
}

export async function deleteAcceptedFriendship(
  tx: PoolClient,
  id: number,
  actorId: number,
): Promise<Friendship | null> {
  const result = await tx.query<FriendshipRow>(
    `DELETE FROM friendships
      WHERE id = $1 AND status = $2 AND (requester_id = $3 OR addressee_id = $3)
      RETURNING ${COLUMNS}`,
    [id, STATUS_CODE.accepted, actorId],
  );
  const row = result.rows[0];
  return row ? mapFriendship(row) : null;
}

const SEARCH_LIMIT = 20;

type UserSearchRow = {
  id: number;
  name: string | null;
  handle: string | null;
  relationship: UserSearchResult['relationship'];
  friendship_id: number | null;
};

function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function mapSearchRow(row: UserSearchRow): UserSearchResult {
  return {
    id: row.id,
    name: row.name ?? 'Пользователь',
    handle: row.handle ?? String(row.id),
    relationship: row.relationship,
    friendshipId: row.friendship_id ?? null,
  };
}

export async function searchUsers(
  actorId: number,
  searchQuery: string,
): Promise<UserSearchResult[]> {
  const rows = await query<UserSearchRow>(
    `WITH results AS (
       SELECT u.id, u.name, u.handle, 'friend'::text AS relationship, f.id AS friendship_id, 0 AS tier
         FROM friendships f
         JOIN users u
           ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
        WHERE f.status = $3
          AND (f.requester_id = $1 OR f.addressee_id = $1)
          AND u.profile_hidden = false
          AND (u.name ILIKE $2 OR u.handle ILIKE $2)
        UNION ALL
        SELECT u.id, u.name, u.handle,
               CASE
                 WHEN rel.requester_id IS NULL THEN 'none'
                 WHEN rel.requester_id = $1 THEN 'pending_out'
                 ELSE 'pending_in'
               END::text AS relationship,
               rel.id AS friendship_id,
               1 AS tier
          FROM users u
          LEFT JOIN LATERAL (
            SELECT f.id, f.requester_id
              FROM friendships f
             WHERE f.status = $4
               AND ((f.requester_id = u.id AND f.addressee_id = $1)
                 OR (f.requester_id = $1 AND f.addressee_id = u.id))
             LIMIT 1
          ) rel ON TRUE
         WHERE u.id <> $1
           AND u.profile_hidden = false
           AND (u.name ILIKE $2 OR u.handle ILIKE $2)
           AND NOT EXISTS (
             SELECT 1
               FROM friendships f
              WHERE f.status = $3
                AND ((f.requester_id = u.id AND f.addressee_id = $1)
                  OR (f.requester_id = $1 AND f.addressee_id = u.id))
           )
     )
     SELECT id, name, handle, relationship, friendship_id
       FROM results
      WHERE tier = 0
         OR NOT EXISTS (SELECT 1 FROM results other WHERE other.tier = 0)
      ORDER BY tier, name NULLS LAST, id
      LIMIT ${SEARCH_LIMIT}`,
    [actorId, likePattern(searchQuery), STATUS_CODE.accepted, STATUS_CODE.pending],
  );
  return rows.map(mapSearchRow);
}
