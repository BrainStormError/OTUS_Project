import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
  usePathname: () => '/',
}));

import { useWatchedRecords } from '@/components/features/movie-tracker/record-store';
import type { Movie } from '@/components/features/movie-tracker/types';
import { useWatchlist } from '@/components/features/movie-tracker/watchlist-store';

const movie: Movie = {
  tmdbId: 27205,
  kind: 'film',
  title: 'Начало',
  year: 2010,
  rating: 8.4,
  genres: ['Фантастика'],
  posterUrl: null,
};

function RecordHarness() {
  const { upsert } = useWatchedRecords([]);
  return (
    <button
      type="button"
      onClick={() =>
        upsert({ id: movie.tmdbId, movie, rating: 9, comment: '', watchedAt: '2024-01-01' })
      }
    >
      save record
    </button>
  );
}

function WatchlistHarness() {
  const { add } = useWatchlist([]);
  return (
    <button type="button" onClick={() => add(movie)}>
      add watchlist
    </button>
  );
}

beforeEach(() => {
  refreshMock.mockClear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ id: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('client cache invalidation after mutations', () => {
  it('refreshes the router once a record is saved', async () => {
    render(<RecordHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'save record' }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });

  it('refreshes the router once a watchlist item is added', async () => {
    render(<WatchlistHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'add watchlist' }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });
});
