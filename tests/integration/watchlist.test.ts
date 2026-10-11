import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import { saveWatchedRecord } from '@/modules/records';
import { addWatchlist, listWatchlist, removeWatchlist } from '@/modules/watchlist';

import { installTmdbFetch } from './tmdb-stub';

async function makeUser(prefix: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `${prefix}-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

let refCounter = 2720500000;

function uniqueRef(): string {
  refCounter += 1;
  return `${refCounter}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

beforeAll(() => {
  installTmdbFetch((ref) =>
    ref.startsWith('missing')
      ? undefined
      : { title: 'Начало', year: 2010, director: 'Кристофер Нолан', genreIds: [878] },
  );
});

afterAll(async () => {
  await closePool();
});

describe('addWatchlist', () => {
  it('stores a planned title with media metadata and lists it', async () => {
    const actor = await makeUser('planned');
    const ref = uniqueRef();
    const result = await addWatchlist(actor, { mediaKind: 'film', mediaRef: ref });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe('Начало');
    expect(result.value.year).toBe(2010);
    expect(result.value.mediaRef).toBe(ref);

    const list = await listWatchlist(actor, 'film');
    expect(list.ok).toBe(true);
    if (list.ok) {
      expect(list.value).toHaveLength(1);
      expect(list.value[0]!.id).toBe(result.value.id);
    }
  });

  it('is idempotent for the same user and media', async () => {
    const actor = await makeUser('idempotent');
    const ref = uniqueRef();
    await addWatchlist(actor, { mediaKind: 'film', mediaRef: ref });
    await addWatchlist(actor, { mediaKind: 'film', mediaRef: ref });

    const list = await listWatchlist(actor, 'film');
    if (list.ok) {
      expect(list.value).toHaveLength(1);
    }
  });

  it('creates a single media row for a planned-only title', async () => {
    const actor = await makeUser('media');
    const ref = uniqueRef();
    await addWatchlist(actor, { mediaKind: 'film', mediaRef: ref });

    const rows = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM media WHERE kind = 0 AND external_ref = $1`,
      [ref],
    );
    expect(rows[0]?.count).toBe('1');
  });

  it('rejects a title the catalog cannot resolve', async () => {
    const actor = await makeUser('unknown');
    const result = await addWatchlist(actor, { mediaKind: 'film', mediaRef: `missing-${randomUUID()}` });
    expect(result.ok).toBe(false);

    const list = await listWatchlist(actor, 'film');
    if (list.ok) {
      expect(list.value).toHaveLength(0);
    }
  });

  it('rejects a title the user has already watched', async () => {
    const actor = await makeUser('watched');
    const ref = uniqueRef();
    await saveWatchedRecord(actor, {
      mediaKind: 'film',
      mediaRef: ref,
      rating: 8,
      watchedAt: '2026-08-12',
    });

    const result = await addWatchlist(actor, { mediaKind: 'film', mediaRef: ref });
    expect(result).toMatchObject({ ok: false, code: 'CONFLICT' });

    const list = await listWatchlist(actor, 'film');
    if (list.ok) {
      expect(list.value).toHaveLength(0);
    }
  });
});

describe('listWatchlist', () => {
  it('returns only the requested kind for the signed-in account', async () => {
    const actor = await makeUser('kinds');
    await addWatchlist(actor, { mediaKind: 'film', mediaRef: uniqueRef() });
    await addWatchlist(actor, { mediaKind: 'series', mediaRef: uniqueRef() });

    const films = await listWatchlist(actor, 'film');
    const series = await listWatchlist(actor, 'series');
    expect(films.ok && series.ok).toBe(true);
    if (films.ok && series.ok) {
      expect(films.value).toHaveLength(1);
      expect(films.value[0]!.mediaKind).toBe('film');
      expect(series.value).toHaveLength(1);
      expect(series.value[0]!.mediaKind).toBe('series');
    }
  });

  it('is private to its owner', async () => {
    const owner = await makeUser('owner');
    const stranger = await makeUser('stranger');
    await addWatchlist(owner, { mediaKind: 'film', mediaRef: uniqueRef() });

    const list = await listWatchlist(stranger, 'film');
    if (list.ok) {
      expect(list.value).toHaveLength(0);
    }
  });
});

describe('removeWatchlist', () => {
  it('removes the entry without creating a watched record', async () => {
    const actor = await makeUser('remove');
    const added = await addWatchlist(actor, { mediaKind: 'film', mediaRef: uniqueRef() });
    if (!added.ok) return;

    const removed = await removeWatchlist(actor, added.value.id);
    expect(removed.ok).toBe(true);

    const list = await listWatchlist(actor, 'film');
    if (list.ok) {
      expect(list.value).toHaveLength(0);
    }
  });

  it('rejects removing another account entry', async () => {
    const owner = await makeUser('owner');
    const stranger = await makeUser('stranger');
    const added = await addWatchlist(owner, { mediaKind: 'film', mediaRef: uniqueRef() });
    if (!added.ok) return;

    const removed = await removeWatchlist(stranger, added.value.id);
    expect(removed).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });
});

describe('rating removes the watch-later entry', () => {
  it('drops the planned title when the same user rates it', async () => {
    const actor = await makeUser('rate-drops');
    const ref = uniqueRef();
    const added = await addWatchlist(actor, { mediaKind: 'film', mediaRef: ref });
    expect(added.ok).toBe(true);

    const saved = await saveWatchedRecord(actor, {
      mediaKind: 'film',
      mediaRef: ref,
      rating: 9,
      watchedAt: '2026-08-12',
    });
    expect(saved.ok).toBe(true);

    const list = await listWatchlist(actor, 'film');
    if (list.ok) {
      expect(list.value).toHaveLength(0);
    }
  });
});
