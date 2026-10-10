import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MySeriesView } from '@/components/features/movie-tracker/MySeriesView';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';

const seriesRecord: WatchedRecord = {
  id: 1,
  movie: {
    tmdbId: 1396,
    kind: 'series',
    title: 'Во все тяжкие',
    year: 2008,
    rating: 0,
    genres: ['Драма'],
    posterUrl: null,
  },
  rating: 9,
  comment: 'Отлично',
  watchedAt: '2026-08-12',
};

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

describe('MySeriesView', () => {
  it('rates a series as a whole and shows no per-episode controls', () => {
    render(<MySeriesView initialRecords={[seriesRecord]} />);
    const table = screen.getByTestId('my-series');
    expect(within(table).getByText('Во все тяжкие')).toBeInTheDocument();
    expect(within(table).getByText('9.0')).toBeInTheDocument();
    expect(screen.queryByText(/Серия/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Сезон/)).not.toBeInTheDocument();
  });

  it('searches series only in the add modal', async () => {
    render(<MySeriesView initialRecords={[]} />);
    await userEvent.click(screen.getByRole('button', { name: /Добавить/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const url = String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] ?? '');
    expect(url).toContain('kind=series');
  });
});
