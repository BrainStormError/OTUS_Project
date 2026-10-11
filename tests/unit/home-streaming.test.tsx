import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
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
  it('renders the header and search field while the slow sections are pending', async () => {
    const pendingPopular = new Promise<CatalogSearchResult[]>(() => {});

    await act(async () => {
      render(<HomeView popularFilmsPromise={pendingPopular} />);
    });

    expect(screen.getByRole('heading', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Поиск' })).toBeInTheDocument();
    expect(screen.getByTestId('popular-skeleton')).toBeInTheDocument();
  });

  it('replaces the skeletons with the streamed content once resolved', async () => {
    const resolvedPopular = Promise.resolve(popularFilms);

    await act(async () => {
      render(<HomeView popularFilmsPromise={resolvedPopular} />);
    });

    expect(await screen.findByText('Начало')).toBeInTheDocument();
    expect(screen.queryByTestId('popular-skeleton')).not.toBeInTheDocument();
  });
});
