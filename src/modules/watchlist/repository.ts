import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { MediaKind, WatchlistEntry } from './types';

const KIND_CODE: Record<MediaKind, number> = { film: 0, series: 1 };
const KIND_NAME: Record<number, MediaKind> = { 0: 'film', 1: 'series' };

function kindFromCode(code: number): MediaKind {
  return KIND_NAME[code] ?? 'film';
}

type WatchlistRow = {
  id: number;
  user_id: number;
  media_id: number;
  media_kind: number;
  media_ref: string;
  title: string;
  year: number | null;
  genres: string[];
  created_at: Date;
};

const SELECT = `w.id, w.user_id, w.media_id, m.kind AS media_kind,
  m.external_ref AS media_ref, m.title, m.year,
  COALESCE((SELECT array_agg(g.name ORDER BY g.id) FROM genres g WHERE g.id = ANY(m.genre_ids)), '{}') AS genres,
  w.created_at`;

function mapEntry(row: WatchlistRow): WatchlistEntry {
  return {
    id: row.id,
    userId: row.user_id,
    mediaId: row.media_id,
    mediaKind: kindFromCode(row.media_kind),
    mediaRef: row.media_ref,
    title: row.title,
    year: row.year,
    genres: row.genres,
    createdAt: row.created_at.toISOString(),
  };
}

export async function upsertWatchlist(
  tx: PoolClient,
  userId: number,
  mediaId: number,
): Promise<WatchlistEntry> {
  await tx.query(
    `INSERT INTO watchlist (user_id, media_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, media_id) DO NOTHING`,
    [userId, mediaId],
  );
  const result = await tx.query<WatchlistRow>(
    `SELECT ${SELECT}
       FROM watchlist w
       JOIN media m ON m.id = w.media_id
      WHERE w.user_id = $1 AND w.media_id = $2`,
    [userId, mediaId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertWatchlist returned no row');
  }
  return mapEntry(row);
}

export async function listWatchlist(
  userId: number,
  kind: MediaKind,
): Promise<WatchlistEntry[]> {
  const rows = await query<WatchlistRow>(
    `SELECT ${SELECT}
       FROM watchlist w
       JOIN media m ON m.id = w.media_id
      WHERE w.user_id = $1 AND m.kind = $2
      ORDER BY w.created_at DESC, w.id DESC`,
    [userId, KIND_CODE[kind]],
  );
  return rows.map(mapEntry);
}

export async function deleteWatchlist(userId: number, id: number): Promise<boolean> {
  const rows = await query<{ id: number }>(
    `DELETE FROM watchlist
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [id, userId],
  );
  return rows.length > 0;
}

export async function deleteWatchlistForMediaTx(
  tx: PoolClient,
  userId: number,
  mediaId: number,
): Promise<void> {
  await tx.query('DELETE FROM watchlist WHERE user_id = $1 AND media_id = $2', [userId, mediaId]);
}

export async function hasPersonalRating(
  tx: PoolClient,
  userId: number,
  mediaId: number,
): Promise<boolean> {
  const result = await tx.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM ratings
        WHERE user_id = $1 AND media_id = $2 AND group_id IS NULL
     ) AS exists`,
    [userId, mediaId],
  );
  return result.rows[0]?.exists === true;
}
