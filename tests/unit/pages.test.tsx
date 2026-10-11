import { render, screen } from '@testing-library/react';
import { Suspense, isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { resolveDetailMock, getActorMock, listWatchedRecordsMock, listWatchlistMock, notFoundMock } =
  vi.hoisted(() => ({
    resolveDetailMock: vi.fn(),
    getActorMock: vi.fn(),
    listWatchedRecordsMock: vi.fn(),
    listWatchlistMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
  }));

vi.mock('@/modules/catalog', () => ({ resolveDetail: resolveDetailMock }));
vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));
vi.mock('@/modules/records', () => ({ listWatchedRecords: listWatchedRecordsMock }));
vi.mock('@/modules/watchlist', () => ({ listWatchlist: listWatchlistMock }));
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import FilmPage from '@/app/(app)/film/[tmdbId]/page';
import SeriesDetailPage from '@/app/(app)/series/[tmdbId]/page';
import { FilmDetailSection } from '@/components/features/movie-tracker/FilmDetailSection';

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

function findAll(
  node: ReactNode,
  predicate: (element: ReactElement<Record<string, unknown>>) => boolean,
): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findAll(child, predicate));
  }
  if (!isValidElement(node)) {
    return [];
  }
  const element = node as ReactElement<Record<string, unknown>>;
  const found = predicate(element) ? [element] : [];
  return found.concat(findAll(element.props['children'] as ReactNode, predicate));
}

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(null);
});

describe('Film detail section', () => {
  it('renders the resolved detail for a known film', async () => {
    resolveDetailMock.mockResolvedValue(ok(filmDetail));
    const ui = await FilmDetailSection({ kind: 'film', tmdbId: '603' });
    render(ui);

    expect(resolveDetailMock).toHaveBeenCalledWith('film', '603');
    expect(screen.getByRole('heading', { name: 'Матрица' })).toBeInTheDocument();
  });

  it('raises not-found inside the section for an unknown id', async () => {
    resolveDetailMock.mockResolvedValue(err('NOT_FOUND', 'unknown'));
    await expect(FilmDetailSection({ kind: 'film', tmdbId: '0' })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('renders the resolved series detail', async () => {
    resolveDetailMock.mockResolvedValue(ok(seriesDetail));
    const ui = await FilmDetailSection({ kind: 'series', tmdbId: '1396' });
    render(ui);
    expect(screen.getByRole('heading', { name: 'Во все тяжкие' })).toBeInTheDocument();
  });
});

describe('Detail page shell', () => {
  it('returns the container with a back link and a streaming skeleton before the section', async () => {
    const tree = await FilmPage({ params: Promise.resolve({ tmdbId: '603' }) });

    const links = findAll(tree, (element) => typeof element.props['href'] === 'string');
    expect(
      links.some((link) => String(link.props['children']).includes('Назад к поиску')),
    ).toBe(true);

    const suspenses = findAll(tree, (element) => element.type === Suspense);
    expect(suspenses).toHaveLength(1);
    const fallback = suspenses[0]!.props['fallback'] as ReactNode;
    render(fallback);
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument();
    expect(resolveDetailMock).not.toHaveBeenCalled();
  });

  it('points the series shell back to the series list', async () => {
    const tree = await SeriesDetailPage({ params: Promise.resolve({ tmdbId: '1396' }) });
    const links = findAll(tree, (element) => typeof element.props['href'] === 'string');
    expect(links.some((link) => link.props['href'] === '/series')).toBe(true);
  });
});
