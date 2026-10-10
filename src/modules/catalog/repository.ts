import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { CatalogMediaKind, RatedTitle } from './types';

const KIND_CODE: Record<CatalogMediaKind, number> = { film: 0, series: 1 };

export async function listKnownGenreIds(tx?: PoolClient): Promise<number[]> {
  const rows = tx
    ? (await tx.query<{ id: number }>('SELECT id FROM genres ORDER BY id')).rows
    : await query<{ id: number }>('SELECT id FROM genres ORDER BY id');
  return rows.map((row) => row.id);
}

type RatedTitleRow = {
  rating_id: number;
  media_id: number;
  kind: number;
  external_ref: string;
  title: string;
  year: number | null;
  director: string | null;
  genres: string[];
  rating: number;
  comment: string | null;
  watched_at: Date;
};

function kindFromCode(code: number): CatalogMediaKind {
  return code === 1 ? 'series' : 'film';
}

export async function listRatedTitles(
  userId: number,
  kind: CatalogMediaKind,
): Promise<RatedTitle[]> {
  const rows = await query<RatedTitleRow>(
    `SELECT r.id AS rating_id, m.id AS media_id, m.kind, m.external_ref, m.title, m.year,
            m.director,
            COALESCE((SELECT array_agg(g.name ORDER BY g.id) FROM genres g WHERE g.id = ANY(m.genre_ids)), '{}') AS genres,
            r.rating, r.comment, r.watched_at
       FROM ratings r
       JOIN media m ON m.id = r.media_id
      WHERE r.user_id = $1 AND r.group_id IS NULL AND m.kind = $2
      ORDER BY r.watched_at DESC, r.id DESC`,
    [userId, KIND_CODE[kind]],
  );

  return rows.map((row) => ({
    ratingId: row.rating_id,
    mediaId: row.media_id,
    kind: kindFromCode(row.kind),
    externalRef: row.external_ref,
    title: row.title,
    year: row.year,
    director: row.director,
    genres: row.genres,
    rating: row.rating / 10,
    comment: row.comment,
    watchedAt: row.watched_at.toISOString().slice(0, 10),
  }));
}
