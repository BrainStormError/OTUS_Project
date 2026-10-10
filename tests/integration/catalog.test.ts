import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import { listCatalog } from '@/modules/catalog';
import { saveWatchedRecord } from '@/modules/records';

import { installTmdbFetch } from './tmdb-stub';

async function makeUser(prefix: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `${prefix}-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

beforeAll(async () => {
  await query(
    `INSERT INTO genres (id, name) VALUES (18, 'Драма'), (878, 'Фантастика')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
  );
  installTmdbFetch(() => ({
    title: 'Начало',
    year: 2010,
    director: 'Кристофер Нолан',
    genreIds: [878, 999999],
  }));
});

afterAll(async () => {
  await closePool();
});

describe('catalog read', () => {
  it('stores only genre ids that exist in the reference data', async () => {
    const actor = await makeUser('catalog-owner');
    const saved = await saveWatchedRecord(actor, {
      mediaKind: 'film',
      mediaRef: `ref-${randomUUID().slice(0, 8)}`,
      rating: 8,
      watchedAt: '2026-08-12',
    });
    expect(saved.ok).toBe(true);

    const result = await listCatalog(actor.id, 'film');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.genres).toEqual(['Фантастика']);
    expect(result.value[0]!.director).toBe('Кристофер Нолан');
  });

  it('returns only the rated titles of the requested kind', async () => {
    const actor = await makeUser('catalog-kind');
    const filmRef = `film-${randomUUID().slice(0, 8)}`;
    const seriesRef = `series-${randomUUID().slice(0, 8)}`;

    await saveWatchedRecord(actor, {
      mediaKind: 'film',
      mediaRef: filmRef,
      rating: 7,
      watchedAt: '2026-08-12',
    });
    await saveWatchedRecord(actor, {
      mediaKind: 'series',
      mediaRef: seriesRef,
      rating: 9,
      watchedAt: '2026-08-12',
    });

    const films = await listCatalog(actor.id, 'film');
    const series = await listCatalog(actor.id, 'series');
    expect(films.ok && series.ok).toBe(true);
    if (!films.ok || !series.ok) return;
    expect(films.value).toHaveLength(1);
    expect(films.value[0]!.kind).toBe('film');
    expect(series.value).toHaveLength(1);
    expect(series.value[0]!.kind).toBe('series');
  });
});
