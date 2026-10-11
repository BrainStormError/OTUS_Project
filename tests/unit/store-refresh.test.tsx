import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
  usePathname: () => '/',
}));

import { useWatchedRecords } from '@/components/features/movie-tracker/record-store';
import type { Movie, WatchedRecord } from '@/components/features/movie-tracker/types';
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

const record: WatchedRecord = {
  id: 7,
  movie,
  rating: 9,
  comment: '',
  watchedAt: '2024-01-01',
};

function RecordsProbe({ records }: { records: WatchedRecord[] }) {
  const { records: current } = useWatchedRecords(records);
  return <div data-testid="records-probe" data-count={current.length} />;
}

function WatchlistProbe({ items }: { items: { id: number; movie: Movie; addedAt: string }[] }) {
  const { items: current } = useWatchlist(items);
  return <div data-testid="watchlist-probe" data-count={current.length} />;
}

describe('stores reconcile with refreshed server props', () => {
  it('adopts the new record props after the server removes a record', async () => {
    const { rerender } = render(<RecordsProbe records={[record]} />);
    expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '1');

    await act(async () => {
      rerender(<RecordsProbe records={[]} />);
    });

    expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '0');
  });

  it('adopts the new watchlist props after the server removes an item', async () => {
    const item = { id: 3, movie, addedAt: '2024-01-01' };
    const { rerender } = render(<WatchlistProbe items={[item]} />);
    expect(screen.getByTestId('watchlist-probe')).toHaveAttribute('data-count', '1');

    await act(async () => {
      rerender(<WatchlistProbe items={[]} />);
    });

    expect(screen.getByTestId('watchlist-probe')).toHaveAttribute('data-count', '0');
  });
});
