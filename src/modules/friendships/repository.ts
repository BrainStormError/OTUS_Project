import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { FriendRequestSummary, Friendship, SocialUser } from './types';

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: Date;
  updated_at: Date;
};

type RequestRow = {
  id: string;
  id_user: string;
  name: string | null;
  handle: string | null;
};

const COLUMNS = 'id, requester_id, addressee_id, status, created_at, updated_at';

function mapFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
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
      handle: row.handle ?? row.id_user.slice(0, 8),
    },
  };
}

export async function findFriendshipById(id: string): Promise<Friendship | null> {
  const rows = await query<FriendshipRow>(`SELECT ${COLUMNS} FROM friendships WHERE id = $1`, [
    id,
  ]);
  const row = rows[0];
  return row ? mapFriendship(row) : null;
}

export async function setFriendshipStatus(
  tx: PoolClient,
  id: string,
  addresseeId: string,
  status: 'accepted' | 'declined',
): Promise<Friendship | null> {
  const result = await tx.query<FriendshipRow>(
    `UPDATE friendships
        SET status = $3, updated_at = now()
      WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
      RETURNING ${COLUMNS}`,
    [id, addresseeId, status],
  );
  const row = result.rows[0];
  return row ? mapFriendship(row) : null;
}

export async function listFriends(userId: string): Promise<SocialUser[]> {
  const rows = await query<{ id: string; name: string | null; handle: string | null }>(
    `SELECT u.id, u.name, u.handle
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
      WHERE f.status = 'accepted'
        AND (f.requester_id = $1 OR f.addressee_id = $1)
        AND u.profile_hidden = false
      ORDER BY u.name NULLS LAST, u.id`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? 'Пользователь',
    handle: row.handle ?? row.id.slice(0, 8),
  }));
}

export async function listIncomingRequests(userId: string): Promise<FriendRequestSummary[]> {
  const rows = await query<RequestRow>(
    `SELECT f.id, u.id AS id_user, u.name, u.handle
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
    [userId],
  );
  return rows.map(mapRequest);
}

export async function listOutgoingRequests(userId: string): Promise<FriendRequestSummary[]> {
  const rows = await query<RequestRow>(
    `SELECT f.id, u.id AS id_user, u.name, u.handle
       FROM friendships f
       JOIN users u ON u.id = f.addressee_id
      WHERE f.requester_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
    [userId],
  );
  return rows.map(mapRequest);
}
