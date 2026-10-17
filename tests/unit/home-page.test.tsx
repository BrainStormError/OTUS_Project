import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HomeScreen } from '@/components/features/movie-tracker/screens/home-screen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
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
    return json({ items: [{ id: 1, name: 'Драма' }] });
  }
  if (url.pathname === '/api/records') {
    return json({ items: [filmRecord, seriesRecord] });
  }
  if (url.pathname === '/api/watchlist') {
    return json({ items: [] });
  }
  if (url.pathname === '/api/search') {
    return json({ items: [], page: 1, hasMore: false });
  }
  return json({});
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe('HomeScreen data', () => {
  it('reads both film and series records and the watchlist of both kinds', async () => {
    vi.stubGlobal('fetch', fetchMock);
    render(<HomeScreen />);

    expect(await screen.findByRole('heading', { name: 'Главная' })).toBeInTheDocument();

    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls).toContain('/api/records');
    expect(urls).toContain('/api/watchlist?kind=film');
    expect(urls).toContain('/api/watchlist?kind=series');
    expect(urls).toContain('/api/search?kind=film');
  });

  it('renders nothing before the reads answer', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const { container } = render(<HomeScreen />);
    expect(container).toBeEmptyDOMElement();
  });
});
