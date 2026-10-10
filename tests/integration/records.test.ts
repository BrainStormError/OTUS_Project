import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool } from '@/core/db/pool';
import { insertUser } from '@/modules/auth/repository';
import { deleteWatchedRecord, listWatchedRecords, saveWatchedRecord } from '@/modules/records';

import { installTmdbFetch } from './tmdb-stub';

async function makeUser(prefix: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `${prefix}-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

function input(ref: string) {
  return {
    mediaKind: 'film' as const,
    mediaRef: ref,
    rating: 8,
    watchedAt: '2026-08-12',
  };
}

beforeAll(() => {
  installTmdbFetch(() => ({ title: 'Начало', year: 2010, director: 'Кристофер Нолан', genreIds: [878] }));
});

afterAll(async () => {
  await closePool();
});

describe('listWatchedRecords', () => {
  it('returns the account records with kind, ref, title, rating, and watch date', async () => {
    const actor = await makeUser('owner');
    await saveWatchedRecord(actor, input(`ref-${randomUUID().slice(0, 8)}`));

    const result = await listWatchedRecords(actor);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    const entry = result.value[0]!;
    expect(entry.mediaKind).toBe('film');
    expect(entry.title).toBe('Начало');
    expect(entry.rating).toBe(8);
    expect(entry.watchedAt).toMatch(/^2026-08-1[12]$/);
    expect(typeof entry.id).toBe('number');
  });

  it('only returns the signed-in account records', async () => {
    const owner = await makeUser('owner');
    const stranger = await makeUser('stranger');
    await saveWatchedRecord(owner, input(`ref-${randomUUID().slice(0, 8)}`));

    const strangerResult = await listWatchedRecords(stranger);
    expect(strangerResult.ok).toBe(true);
    if (strangerResult.ok) {
      expect(strangerResult.value).toHaveLength(0);
    }
  });
});

describe('deleteWatchedRecord', () => {
  it('removes the record for its owner', async () => {
    const actor = await makeUser('owner');
    const saved = await saveWatchedRecord(actor, input(`ref-${randomUUID().slice(0, 8)}`));
    if (!saved.ok) return;

    const deleted = await deleteWatchedRecord(actor, saved.value.id);
    expect(deleted.ok).toBe(true);

    const remaining = await listWatchedRecords(actor);
    if (remaining.ok) {
      expect(remaining.value).toHaveLength(0);
    }
  });

  it('rejects deleting another account record', async () => {
    const owner = await makeUser('owner');
    const stranger = await makeUser('stranger');
    const saved = await saveWatchedRecord(owner, input(`ref-${randomUUID().slice(0, 8)}`));
    if (!saved.ok) return;

    const deleted = await deleteWatchedRecord(stranger, saved.value.id);
    expect(deleted).toMatchObject({ ok: false, code: 'NOT_FOUND' });

    const remaining = await listWatchedRecords(owner);
    if (remaining.ok) {
      expect(remaining.value).toHaveLength(1);
    }
  });
});
