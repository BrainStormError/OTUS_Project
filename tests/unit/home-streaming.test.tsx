import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
import type { FeedEvent } from '@/components/features/movie-tracker/feed';
import type { CatalogSearchResult } from '@/modules/catalog';

const popularFilms: CatalogSearchResult[] = [
  {
    kind: 'film',
    externalId: '27205',
    title: 'Начало',
    year: 2010,
    posterUrl: null,
    externalRating: 8.4,
    genres: ['Фантастика'],
    genreIds: [878],
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomeView streaming shell', () => {
  it('renders the header and search field while the slow sections are pending', () => {
    const pendingPopular = new Promise<CatalogSearchResult[]>(() => {});
    const pendingFeed = new Promise<FeedEvent[]>(() => {});

    render(<HomeView popularFilmsPromise={pendingPopular} initialFeedPromise={pendingFeed} />);

    expect(screen.getByRole('heading', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Поиск' })).toBeInTheDocument();
    expect(screen.getByTestId('popular-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('feed-skeleton')).toBeInTheDocument();
  });

  it('replaces the skeletons with the streamed content once resolved', async () => {
    render(
      <HomeView
        popularFilmsPromise={Promise.resolve(popularFilms)}
        initialFeedPromise={Promise.resolve([])}
      />,
    );

    expect(await screen.findByText('Начало')).toBeInTheDocument();
    expect(screen.queryByTestId('popular-skeleton')).not.toBeInTheDocument();
  });
});
