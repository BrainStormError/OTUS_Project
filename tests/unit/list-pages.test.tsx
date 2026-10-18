import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import FilmsPage from '@/app/(app)/films/page';
import SeriesPage from '@/app/(app)/series/page';
import { CatalogListScreen } from '@/components/features/movie-tracker/screens/catalog-screens';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/films',
}));

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

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = new URL(String(input), 'http://localhost');
  if (url.pathname === '/api/genres') {
    return json({ items: [] });
  }
  if (url.pathname === '/api/records') {
    return json({ items: [filmRecord, seriesRecord] });
  }
  if (url.pathname === '/api/watchlist') {
    return json({ items: [] });
  }
  return json({});
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe('list screens', () => {
  it('renders the film shell immediately and fills it from the read contract', async () => {
    vi.stubGlobal('fetch', fetchMock);
    render(<FilmsPage />);

    expect(screen.getByRole('heading', { name: 'Мои фильмы' })).toBeInTheDocument();

    const list = await screen.findByTestId('my-films');
    expect(within(list).getByText('Начало')).toBeInTheDocument();
    expect(within(list).queryByText('Во все тяжкие')).not.toBeInTheDocument();
  });

  it('renders the series shell immediately and fills it from the read contract', async () => {
    vi.stubGlobal('fetch', fetchMock);
    render(<SeriesPage />);

    expect(screen.getByRole('heading', { name: 'Мои сериалы' })).toBeInTheDocument();

    const list = await screen.findByTestId('my-series');
    expect(within(list).getByText('Во все тяжкие')).toBeInTheDocument();
    expect(within(list).queryByText('Начало')).not.toBeInTheDocument();
  });

  it('leaves the reserved area empty while the reads are pending', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const { container } = render(<CatalogListScreen kind="film" />);
    expect(container).toBeEmptyDOMElement();
  });
});
