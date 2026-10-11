import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MyFilmsView } from '@/components/features/movie-tracker/MyFilmsView';
import type {
  Movie,
  WatchedRecord,
  WatchlistItem,
} from '@/components/features/movie-tracker/types';
import { ToastProvider } from '@/components/ui/toast';

const movie: Movie = {
  tmdbId: 27205,
  kind: 'film',
  title: 'Начало',
  year: 2010,
  rating: 0,
  genres: ['фантастика'],
  posterUrl: null,
};

const record: WatchedRecord = {
  id: 3,
  movie,
  rating: 8.5,
  watchedAt: '2026-01-01',
};

const planned: WatchlistItem = { id: 1, movie, addedAt: '2026-02-03' };

function stubFetch() {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('/api/records')) {
      return Promise.resolve({ ok: true, json: async () => ({ id: 11 }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ id: 2 }) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderView(initialWatchlist: WatchlistItem[] = [planned]) {
  return render(
    <ToastProvider>
      <MyFilmsView initialRecords={[record]} initialWatchlist={initialWatchlist} />
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MyFilmsView watch-later tab', () => {
  it('shows the watched list by default', () => {
    renderView();
    expect(screen.getByTestId('my-films')).toBeInTheDocument();
    expect(screen.queryByTestId('my-films-watchlist')).not.toBeInTheDocument();
  });

  it('lists watch-later titles with Название, Год, and added date', async () => {
    renderView();
    await userEvent.click(screen.getByRole('tab', { name: 'Буду смотреть' }));

    const table = screen.getByTestId('my-films-watchlist');
    expect(within(table).getByText('Название')).toBeInTheDocument();
    expect(within(table).getByText('Год')).toBeInTheDocument();
    expect(within(table).getByText('Добавлено')).toBeInTheDocument();
    expect(within(table).getByText('Начало')).toBeInTheDocument();
    expect(within(table).getByText('2010')).toBeInTheDocument();
    expect(within(table).getByText('2026-02-03')).toBeInTheDocument();
  });

  it('shows an empty state when the list is empty', async () => {
    renderView([]);
    await userEvent.click(screen.getByRole('tab', { name: 'Буду смотреть' }));
    expect(screen.getByText('Список «Буду смотреть» пуст')).toBeInTheDocument();
  });

  it('rates an entry, moving it out of the list', async () => {
    const fetchMock = stubFetch();
    renderView();
    await userEvent.click(screen.getByRole('tab', { name: 'Буду смотреть' }));

    const table = screen.getByTestId('my-films-watchlist');
    await userEvent.click(within(table).getByRole('button', { name: 'Оценить' }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('spinbutton', { name: 'Оценка (0–10)' }), '9');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/records',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText('Список «Буду смотреть» пуст')).toBeInTheDocument(),
    );
  });

  it('removes an entry without rating', async () => {
    const fetchMock = stubFetch();
    renderView();
    await userEvent.click(screen.getByRole('tab', { name: 'Буду смотреть' }));

    const table = screen.getByTestId('my-films-watchlist');
    await userEvent.click(within(table).getByRole('button', { name: 'Удалить' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/watchlist?id=1', { method: 'DELETE' });
    await waitFor(() =>
      expect(screen.getByText('Список «Буду смотреть» пуст')).toBeInTheDocument(),
    );
  });
});
