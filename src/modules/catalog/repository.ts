import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { CatalogMediaKind, Genre, RatedTitle } from './types';

const KIND_CODE: Record<CatalogMediaKind, number> = { film: 0, series: 1 };

const GENRE_TABLE: Record<CatalogMediaKind, string> = {
  film: 'film_genres',
  series: 'series_genres',
};

export async function listGenres(kind: CatalogMediaKind): Promise<Genre[]> {
  const rows = await query<{ id: number; name: string }>(
    `SELECT id, name FROM ${GENRE_TABLE[kind]} ORDER BY name`,
  );
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function listKnownGenreIds(
  kind: CatalogMediaKind,
  tx?: PoolClient,
): Promise<number[]> {
  const sql = `SELECT id FROM ${GENRE_TABLE[kind]} ORDER BY id`;
  const rows = tx
    ? (await tx.query<{ id: number }>(sql)).rows
    : await query<{ id: number }>(sql);
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
            COALESCE(
              CASE WHEN m.kind = 1
                THEN (SELECT array_agg(sg.name ORDER BY sg.id) FROM series_genres sg WHERE sg.id = ANY(m.genre_ids))
                ELSE (SELECT array_agg(fg.name ORDER BY fg.id) FROM film_genres fg WHERE fg.id = ANY(m.genre_ids))
              END, '{}') AS genres,
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
