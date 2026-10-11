import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ok } from '@/core/result';

const { getActorMock, listWatchedRecordsMock, listWatchlistMock, searchCatalogMock, listGenresMock } =
  vi.hoisted(() => ({
    getActorMock: vi.fn(),
    listWatchedRecordsMock: vi.fn(),
    listWatchlistMock: vi.fn(),
    searchCatalogMock: vi.fn(),
    listGenresMock: vi.fn(),
  }));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));
vi.mock('@/modules/records', () => ({ listWatchedRecords: listWatchedRecordsMock }));
vi.mock('@/modules/watchlist', () => ({ listWatchlist: listWatchlistMock }));
vi.mock('@/modules/catalog', () => ({
  searchCatalog: searchCatalogMock,
  listGenres: listGenresMock,
}));

import HomePage from '@/app/(app)/page';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';

const actor = { id: 1, role: 'employee' as const };

const filmRecord = {
  id: 1,
  userId: 1,
  mediaId: 10,
  mediaKind: 'film' as const,
  mediaRef: '27205',
  title: 'Начало',
  year: 2010,
  genres: ['Фантастика'],
  rating: 9,
  comment: null,
  watchedAt: '2024-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const seriesRecord = {
  id: 2,
  userId: 1,
  mediaId: 20,
  mediaKind: 'series' as const,
  mediaRef: '1396',
  title: 'Во все тяжкие',
  year: 2008,
  genres: ['Драма'],
  rating: 10,
  comment: null,
  watchedAt: '2024-02-01',
  createdAt: '2024-02-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(actor);
  listWatchedRecordsMock.mockResolvedValue(ok([filmRecord, seriesRecord]));
  listWatchlistMock.mockResolvedValue(ok([]));
  searchCatalogMock.mockResolvedValue(ok({ items: [], page: 1, hasMore: false }));
  listGenresMock.mockResolvedValue(ok([]));
});

describe('HomePage records', () => {
  it('passes both film and series watched records to the view', async () => {
    const tree = await HomePage();
    const records = tree.props['initialRecords'] as WatchedRecord[];

    expect(records.map((record) => record.movie.kind)).toEqual(['film', 'series']);
    expect(records[1]!.rating).toBe(10);
  });

  it('loads the watchlist for both kinds so series state is correct', async () => {
    await HomePage();

    expect(listWatchlistMock).toHaveBeenCalledWith(actor, 'film');
    expect(listWatchlistMock).toHaveBeenCalledWith(actor, 'series');
  });
});
