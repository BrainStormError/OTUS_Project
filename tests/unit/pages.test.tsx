import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { pathname } = vi.hoisted(() => ({ pathname: { value: '/' } }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

import FilmShellPage from '@/app/(app)/shell/film/page';
import SeriesShellPage from '@/app/(app)/shell/series/page';
import { CatalogDetailScreen } from '@/components/features/movie-tracker/screens/catalog-screens';

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function stubCatalog(detail: unknown) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname === '/api/catalog/detail') {
      return json({ item: detail });
    }
    if (url.pathname === '/api/records' || url.pathname === '/api/watchlist') {
      return json({ items: [] });
    }
    return json({});
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Catalog detail screen', () => {
  it('renders the resolved film detail from the read contract', async () => {
    stubCatalog(filmDetail);
    render(<CatalogDetailScreen kind="film" tmdbId="603" />);

    expect(await screen.findByRole('heading', { name: 'Матрица' })).toBeInTheDocument();
  });

  it('renders the resolved series detail from the read contract', async () => {
    stubCatalog(seriesDetail);
    render(<CatalogDetailScreen kind="series" tmdbId="1396" />);

    expect(
      await screen.findByRole('heading', { name: 'Во все тяжкие' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state for a resource the read refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: 'Не найдено', code: 'NOT_FOUND' }, 404)),
    );
    render(<CatalogDetailScreen kind="film" tmdbId="0" />);

    expect(await screen.findByText('Не найдено')).toBeInTheDocument();
  });
});

describe('Detail shell pages', () => {
  it('reads the film id from the browser path after hydration', async () => {
    pathname.value = '/film/603';
    stubCatalog(filmDetail);
    render(<FilmShellPage />);

    expect(screen.getByRole('link', { name: /Назад к поиску/ })).toHaveAttribute('href', '/');
    expect(await screen.findByRole('heading', { name: 'Матрица' })).toBeInTheDocument();
  });

  it('points the series shell back to the series list', async () => {
    pathname.value = '/series/1396';
    stubCatalog(seriesDetail);
    render(<SeriesShellPage />);

    expect(screen.getByRole('link', { name: /Назад к поиску/ })).toHaveAttribute(
      'href',
      '/series',
    );
    expect(
      await screen.findByRole('heading', { name: 'Во все тяжкие' }),
    ).toBeInTheDocument();
  });

  it('renders only the shell before the path is known', () => {
    pathname.value = '/film/603';
    stubCatalog(filmDetail);
    render(<FilmShellPage />);
    expect(screen.getByRole('link', { name: /Назад к поиску/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Матрица' })).not.toBeInTheDocument();
  });
});
