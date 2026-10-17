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

describe('mutations refresh through the read store, not the document', () => {
  it('does not re-render the document when a record is saved', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response(JSON.stringify({ id: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<RecordHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'save record' }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([, init]) => (init as RequestInit | undefined)?.cache === 'reload',
        ),
      ).not.toHaveLength(0),
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('does not re-render the document when a watchlist item is added', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response(JSON.stringify({ id: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<WatchlistHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'add watchlist' }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([, init]) => (init as RequestInit | undefined)?.cache === 'reload',
        ),
      ).not.toHaveLength(0),
    );
    expect(refreshMock).not.toHaveBeenCalled();
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

function RecordsTextProbe({ records }: { records: WatchedRecord[] }) {
  const { records: current } = useWatchedRecords(records);
  return <div data-testid="records-text">{current.map((item) => item.comment ?? '').join('|')}</div>;
}

const otherMovie: Movie = {
  tmdbId: 4242,
  kind: 'film',
  title: 'Матрица',
  year: 1999,
  rating: 8.6,
  genres: ['Фантастика'],
  posterUrl: null,
};

function SaveRecordButton({ target }: { target?: WatchedRecord }) {
  const { upsert } = useWatchedRecords([]);
  return (
    <button
      type="button"
      onClick={() =>
        upsert(
          target ?? {
            id: otherMovie.tmdbId,
            movie: otherMovie,
            rating: 9,
            comment: '',
            watchedAt: '2024-01-01',
          },
        )
      }
    >
      save record
    </button>
  );
}

function AddWatchlistButton({ target }: { target?: Movie }) {
  const { add } = useWatchlist([]);
  return (
    <button type="button" onClick={() => add(target ?? otherMovie)}>
      add watchlist
    </button>
  );
}

describe('shared store serves all subscribers', () => {
  it('shows one added record to two subscribers of the watched store', async () => {
    function DualRecords() {
      const a = useWatchedRecords([]);
      const b = useWatchedRecords([]);
      return (
        <>
          <div data-testid="a">{a.records.map((item) => item.movie.title).join('|')}</div>
          <div data-testid="b">{b.records.map((item) => item.movie.title).join('|')}</div>
          <SaveRecordButton />
        </>
      );
    }
    render(<DualRecords />);

    await userEvent.click(screen.getByRole('button', { name: 'save record' }));

    await waitFor(() => expect(screen.getByTestId('a')).toHaveTextContent('Матрица'));
    expect(screen.getByTestId('b')).toHaveTextContent('Матрица');
  });

  it('shows one added watchlist item to two subscribers of the watchlist store', async () => {
    function DualWatchlist() {
      const a = useWatchlist([]);
      const b = useWatchlist([]);
      return (
        <>
          <div data-testid="a">{a.items.map((item) => item.movie.title).join('|')}</div>
          <div data-testid="b">{b.items.map((item) => item.movie.title).join('|')}</div>
          <AddWatchlistButton />
        </>
      );
    }
    render(<DualWatchlist />);

    await userEvent.click(screen.getByRole('button', { name: 'add watchlist' }));

    await waitFor(() => expect(screen.getByTestId('a')).toHaveTextContent('Матрица'));
    expect(screen.getByTestId('b')).toHaveTextContent('Матрица');
  });

  it('shows a record saved in one section to another section with stale props', async () => {
    render(
      <>
        <SaveRecordButton />
        <RecordsProbe records={[record]} />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'save record' }));

    await waitFor(() => expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '2'));
  });
});

describe('server props never wipe unconfirmed local changes', () => {
  it('keeps a just-saved record when late empty props arrive', async () => {
    const { rerender } = render(
      <>
        <SaveRecordButton />
        <RecordsProbe records={[record]} />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'save record' }));
    await waitFor(() => expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '2'));

    await act(async () => {
      rerender(
        <>
          <SaveRecordButton />
          <RecordsProbe records={[]} />
        </>,
      );
    });

    expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '1');
  });

  it('reflects a comment-only change coming from the server', async () => {
    const withComment: WatchedRecord = { ...record, comment: 'старый' };
    const changed: WatchedRecord = { ...record, comment: 'новый' };
    const { rerender } = render(<RecordsTextProbe records={[withComment]} />);
    expect(screen.getByTestId('records-text')).toHaveTextContent('старый');

    await act(async () => {
      rerender(<RecordsTextProbe records={[changed]} />);
    });

    expect(screen.getByTestId('records-text')).toHaveTextContent('новый');
  });
});

describe('failed mutations roll back', () => {
  it('removes the optimistic record when the save fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({}), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    render(
      <>
        <SaveRecordButton />
        <RecordsProbe records={[]} />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'save record' }));

    await waitFor(() => expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '0'));
  });

  it('removes the optimistic watchlist item when the save fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({}), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    render(
      <>
        <AddWatchlistButton />
        <WatchlistProbe items={[]} />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'add watchlist' }));

    await waitFor(() =>
      expect(screen.getByTestId('watchlist-probe')).toHaveAttribute('data-count', '0'),
    );
  });
});

describe('temporary ids never address foreign records', () => {
  it('does not delete a foreign record while a save is in flight', async () => {
    const foreign: WatchedRecord = {
      id: movie.tmdbId,
      movie: otherMovie,
      rating: 5,
      comment: 'чужая запись',
      watchedAt: '2024-01-01',
    };
    const newRecord: WatchedRecord = {
      id: movie.tmdbId,
      movie,
      rating: 9,
      comment: '',
      watchedAt: '2024-01-02',
    };
    let resolveSave: ((value: Response) => void) | null = null;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/records?id=')) {
        return Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
      return new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    function ForeignAndNew() {
      const { remove } = useWatchedRecords([foreign]);
      return (
        <>
          <RecordsProbe records={[foreign]} />
          <SaveRecordButton target={newRecord} />
          <button type="button" onClick={() => remove(newRecord)}>
            remove during flight
          </button>
        </>
      );
    }
    render(<ForeignAndNew />);

    await userEvent.click(screen.getByRole('button', { name: 'save record' }));
    await userEvent.click(screen.getByRole('button', { name: 'remove during flight' }));

    const deleteCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/api/records?id='),
    );
    expect(deleteCalls).toHaveLength(0);
    expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '1');

    await act(async () => {
      resolveSave?.(
        new Response(JSON.stringify({ id: 77 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/records?id=77', { method: 'DELETE' }),
    );
    expect(screen.getByTestId('records-probe')).toHaveAttribute('data-count', '1');
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes('/api/records?id=27205')),
    ).toBe(false);
  });
});
