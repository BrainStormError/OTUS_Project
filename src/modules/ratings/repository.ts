import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { SaveMetadata } from '@/modules/catalog';

import type { RatingInput } from './schema';
import type { GroupRatingMember, GroupRatingSummary, MediaKind, RatingEntry } from './types';

const KIND_CODE: Record<MediaKind, number> = { film: 0, series: 1 };
const KIND_NAME: Record<number, MediaKind> = { 0: 'film', 1: 'series' };

function kindFromCode(code: number): MediaKind {
  return KIND_NAME[code] ?? 'film';
}

function ratingToHundredths(rating: number): number {
  return Math.min(100, Math.max(0, Math.round(rating * 10)));
}

function ratingFromHundredths(code: number): number {
  return code / 10;
}

type PersonalRow = {
  id: number;
  user_id: number;
  media_id: number;
  media_kind: number;
  media_ref: string;
  title: string;
  year: number | null;
  genres: string[];
  rating: number;
  comment: string | null;
  watched_at: Date;
  created_at: Date;
};

const PERSONAL_SELECT = `u.id, u.user_id, u.media_id, m.kind AS media_kind,
  m.external_ref AS media_ref, m.title, m.year,
  COALESCE((SELECT array_agg(g.name ORDER BY g.id) FROM genres g WHERE g.id = ANY(m.genre_ids)), '{}') AS genres,
  u.rating, u.comment, u.watched_at, u.created_at`;

function mapPersonal(row: PersonalRow): RatingEntry {
  return {
    id: row.id,
    userId: row.user_id,
    mediaId: row.media_id,
    mediaKind: kindFromCode(row.media_kind),
    mediaRef: row.media_ref,
    title: row.title,
    year: row.year,
    genres: row.genres,
    rating: ratingFromHundredths(row.rating),
    comment: row.comment,
    watchedAt: row.watched_at.toISOString().slice(0, 10),
    createdAt: row.created_at.toISOString(),
  };
}

export async function upsertMedia(tx: PoolClient, metadata: SaveMetadata): Promise<number> {
  const result = await tx.query<{ id: number }>(
    `INSERT INTO media (kind, external_ref, title, year, director, genre_ids)
     VALUES ($1, $2, $3, $4, $5,
       COALESCE((SELECT array_agg(id ORDER BY id) FROM genres WHERE id = ANY($6::smallint[])), '{}'::smallint[]))
     ON CONFLICT (kind, external_ref) DO UPDATE SET
       title = EXCLUDED.title,
       year = EXCLUDED.year,
       director = EXCLUDED.director,
       genre_ids = EXCLUDED.genre_ids
     RETURNING id`,
    [
      KIND_CODE[metadata.kind],
      metadata.externalRef,
      metadata.title,
      metadata.year ?? null,
      metadata.director ?? null,
      metadata.genreIds,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertMedia returned no row');
  }
  return row.id;
}

export async function upsertPersonalRating(
  tx: PoolClient,
  userId: number,
  mediaId: number,
  input: RatingInput,
): Promise<RatingEntry> {
  const result = await tx.query<PersonalRow>(
    `WITH upserted AS (
       INSERT INTO ratings (user_id, media_id, group_id, rating, comment, watched_at)
       VALUES ($1, $2, NULL, $3, $4, $5)
       ON CONFLICT (user_id, media_id) WHERE group_id IS NULL DO UPDATE SET
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment,
         watched_at = EXCLUDED.watched_at
       RETURNING id, user_id, media_id, rating, comment, watched_at, created_at
     )
     SELECT ${PERSONAL_SELECT}
       FROM upserted u
       JOIN media m ON m.id = u.media_id`,
    [
      userId,
      mediaId,
      ratingToHundredths(input.rating),
      input.comment ?? null,
      input.watchedAt,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertPersonalRating returned no row');
  }
  return mapPersonal(row);
}

type GroupRow = {
  media_id: number;
  user_id: number;
  name: string | null;
  handle: string | null;
  rating: number;
  comment: string | null;
  watched_at: Date;
  created_at: Date;
};

const GROUP_MEMBER_SELECT = `u.media_id, u.user_id, usr.name, usr.handle, u.rating,
  u.comment, u.watched_at, u.created_at`;

function mapGroupMember(row: GroupRow): GroupRatingMember {
  return {
    mediaId: row.media_id,
    userId: row.user_id,
    name: row.name ?? 'Пользователь',
    handle: row.handle ?? String(row.user_id),
    rating: ratingFromHundredths(row.rating),
    comment: row.comment,
    watchedAt: row.watched_at.toISOString().slice(0, 10),
    createdAt: row.created_at.toISOString(),
  };
}

export async function upsertGroupRating(
  tx: PoolClient,
  userId: number,
  groupId: number,
  mediaId: number,
  input: RatingInput,
): Promise<GroupRatingMember> {
  const result = await tx.query<GroupRow>(
    `WITH upserted AS (
       INSERT INTO ratings (user_id, media_id, group_id, rating, comment, watched_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (group_id, user_id, media_id) WHERE group_id IS NOT NULL DO UPDATE SET
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment,
         watched_at = EXCLUDED.watched_at
       RETURNING media_id, user_id, rating, comment, watched_at, created_at
     )
     SELECT ${GROUP_MEMBER_SELECT}
       FROM upserted u
       JOIN users usr ON usr.id = u.user_id`,
    [
      userId,
      mediaId,
      groupId,
      ratingToHundredths(input.rating),
      input.comment ?? null,
      input.watchedAt,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('upsertGroupRating returned no row');
  }
  return mapGroupMember(row);
}

type GroupListRow = GroupRow & {
  media_kind: number;
  media_ref: string;
  title: string;
  year: number | null;
  average: string;
  discussion_id: number | null;
};

export async function listGroupRatings(groupId: number): Promise<GroupRatingSummary[]> {
  const rows = await query<GroupListRow>(
    `SELECT r.media_id, r.user_id, usr.name, usr.handle, r.rating, r.comment,
            r.watched_at, r.created_at, m.kind AS media_kind, m.external_ref AS media_ref,
            m.title, m.year, d.id AS discussion_id,
            ROUND(AVG(r.rating) OVER (PARTITION BY r.media_id), 1) AS average
       FROM ratings r
       JOIN media m ON m.id = r.media_id
       JOIN users usr ON usr.id = r.user_id
       LEFT JOIN group_discussions d
         ON d.group_id = r.group_id AND d.media_id = r.media_id
      WHERE r.group_id = $1
      ORDER BY r.media_id, r.created_at DESC, r.user_id`,
    [groupId],
  );

  const summary = new Map<number, GroupRatingSummary>();
  for (const row of rows) {
    let group = summary.get(row.media_id);
    if (!group) {
      group = {
        mediaId: row.media_id,
        mediaKind: kindFromCode(row.media_kind),
        mediaRef: row.media_ref,
        title: row.title,
        year: row.year,
        average: Number(row.average) / 10,
        discussionId: row.discussion_id ?? null,
        ratings: [],
      };
      summary.set(row.media_id, group);
    }
    group.ratings.push(mapGroupMember(row));
  }

  return Array.from(summary.values()).sort((a, b) => {
    const left = a.ratings[0]?.createdAt ?? '';
    const right = b.ratings[0]?.createdAt ?? '';
    return right.localeCompare(left);
  });
}

export async function hasGroupRating(groupId: number, mediaId: number): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM ratings WHERE group_id = $1 AND media_id = $2
     ) AS exists`,
    [groupId, mediaId],
  );
  return rows[0]?.exists === true;
}

export async function hasGroupRatingTx(
  tx: PoolClient,
  groupId: number,
  mediaId: number,
): Promise<boolean> {
  const result = await tx.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM ratings WHERE group_id = $1 AND media_id = $2
     ) AS exists`,
    [groupId, mediaId],
  );
  return result.rows[0]?.exists === true;
}

export async function findMediaIdByRef(
  tx: PoolClient,
  kind: MediaKind,
  externalRef: string,
): Promise<number | null> {
  const result = await tx.query<{ id: number }>(
    `SELECT id FROM media WHERE kind = $1 AND external_ref = $2`,
    [KIND_CODE[kind], externalRef],
  );
  return result.rows[0]?.id ?? null;
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

export async function listPersonalRatings(userId: number): Promise<RatingEntry[]> {
  const rows = await query<PersonalRow>(
    `SELECT r.id, r.user_id, r.media_id, m.kind AS media_kind, m.external_ref AS media_ref,
            m.title, m.year,
            COALESCE((SELECT array_agg(g.name ORDER BY g.id) FROM genres g WHERE g.id = ANY(m.genre_ids)), '{}') AS genres,
            r.rating, r.comment, r.watched_at, r.created_at
       FROM ratings r
       JOIN media m ON m.id = r.media_id
      WHERE r.user_id = $1 AND r.group_id IS NULL
      ORDER BY r.watched_at DESC, r.id DESC`,
    [userId],
  );
  return rows.map(mapPersonal);
}

export async function deletePersonalRating(
  userId: number,
  ratingId: number,
): Promise<boolean> {
  const rows = await query<{ id: number }>(
    `DELETE FROM ratings
      WHERE id = $1 AND user_id = $2 AND group_id IS NULL
      RETURNING id`,
    [ratingId, userId],
  );
  return rows.length > 0;
}
