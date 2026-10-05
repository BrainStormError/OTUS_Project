import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { UpsertWatchedRecordInput } from './schema';
import type { WatchedRecordEntry } from './types';

type RecordRow = {
  id: string;
  user_id: string;
  media_kind: 'film' | 'series';
  media_ref: string;
  title: string;
  year: number | null;
  genres: string[];
  rating: string;
  comment: string | null;
  watched_at: Date;
  created_at: Date;
};

const COLUMNS =
  'id, user_id, media_kind, media_ref, title, year, genres, rating, comment, watched_at, created_at';

function mapRecord(row: RecordRow): WatchedRecordEntry {
  return {
    id: row.id,
    userId: row.user_id,
    mediaKind: row.media_kind,
    mediaRef: row.media_ref,
    title: row.title,
    year: row.year,
    genres: row.genres,
    rating: Number(row.rating),
    comment: row.comment,
    watchedAt: row.watched_at.toISOString().slice(0, 10),
    createdAt: row.created_at.toISOString(),
  };
}

export async function upsertWatchedRecord(
  tx: PoolClient,
  userId: string,
  input: UpsertWatchedRecordInput,
): Promise<WatchedRecordEntry> {
  const result = await tx.query<RecordRow>(
    `INSERT INTO watched_records
       (user_id, media_kind, media_ref, title, year, genres, rating, comment, watched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, media_kind, media_ref) DO UPDATE SET
       title = EXCLUDED.title,
       year = EXCLUDED.year,
       genres = EXCLUDED.genres,
       rating = EXCLUDED.rating,
       comment = EXCLUDED.comment,
       watched_at = EXCLUDED.watched_at
     RETURNING ${COLUMNS}`,
    [
      userId,
      input.mediaKind,
      input.mediaRef,
      input.title,
      input.year ?? null,
      input.genres ?? [],
      input.rating,
      input.comment ?? null,
      input.watchedAt,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertWatchedRecord returned no row');
  }
  return mapRecord(row);
}

export async function listWatchedRecords(userId: string): Promise<WatchedRecordEntry[]> {
  const rows = await query<RecordRow>(
    `SELECT ${COLUMNS}
       FROM watched_records
      WHERE user_id = $1
      ORDER BY watched_at DESC, id DESC`,
    [userId],
  );
  return rows.map(mapRecord);
}
