import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { resolveDetailMock, getActorMock, listWatchedRecordsMock, notFoundMock } = vi.hoisted(
  () => ({
    resolveDetailMock: vi.fn(),
    getActorMock: vi.fn(),
    listWatchedRecordsMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
  }),
);

vi.mock('@/modules/catalog', () => ({ resolveDetail: resolveDetailMock }));
vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));
vi.mock('@/modules/records', () => ({ listWatchedRecords: listWatchedRecordsMock }));
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import FilmPage from '@/app/(app)/film/[tmdbId]/page';
import SeriesDetailPage from '@/app/(app)/series/[tmdbId]/page';

const filmDetail = {
  kind: 'film' as const,
  externalId: '603',
  title: 'Матрица',
  year: 1999,
  posterUrl: null,
  externalRating: 8.7,
  genres: ['Фантастика'],
  genreIds: [878],
  overview: 'Хакер узнаёт правду о мире.',
  director: 'Лана Вачовски',
};

const seriesDetail = {
  kind: 'series' as const,
  externalId: '1396',
  title: 'Во все тяжкие',
  year: 2008,
  posterUrl: null,
  externalRating: 8.9,
  genres: ['Драма'],
  genreIds: [18],
  overview: 'Учитель химии становится наркобароном.',
  director: 'Винс Гиллиган',
};

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(null);
});

describe('Film detail page', () => {
  it('renders a known film resolved through catalog detail', async () => {
    resolveDetailMock.mockResolvedValue(ok(filmDetail));
    const ui = await FilmPage({ params: Promise.resolve({ tmdbId: '603' }) });
    render(ui);

    expect(resolveDetailMock).toHaveBeenCalledWith('film', '603');
    expect(screen.getByRole('heading', { name: 'Матрица' })).toBeInTheDocument();
  });

  it('not-found when the catalog does not know the id', async () => {
    resolveDetailMock.mockResolvedValue(err('NOT_FOUND', 'unknown'));
    await expect(FilmPage({ params: Promise.resolve({ tmdbId: '0' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFoundMock).toHaveBeenCalled();
  });
});

describe('Series detail page', () => {
  it('renders a known series resolved through catalog detail', async () => {
    resolveDetailMock.mockResolvedValue(ok(seriesDetail));
    const ui = await SeriesDetailPage({ params: Promise.resolve({ tmdbId: '1396' }) });
    render(ui);

    expect(resolveDetailMock).toHaveBeenCalledWith('series', '1396');
    expect(screen.getByRole('heading', { name: 'Во все тяжкие' })).toBeInTheDocument();
  });

  it('not-found for an unknown series id', async () => {
    resolveDetailMock.mockResolvedValue(err('NOT_FOUND', 'unknown'));
    await expect(SeriesDetailPage({ params: Promise.resolve({ tmdbId: '0' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFoundMock).toHaveBeenCalled();
  });
});
