import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FilmDetail } from '@/components/features/movie-tracker/FilmDetail';
import { MovieCard } from '@/components/features/movie-tracker/MovieCard';
import type { Movie, WatchedRecord } from '@/components/features/movie-tracker/types';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

const movie: Movie = {
  tmdbId: 27205,
  kind: 'film',
  title: 'Начало',
  year: 2010,
  rating: 8.8,
  genres: ['фантастика'],
  posterUrl: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MovieCard watch-later action', () => {
  it('toggles the planned state on and off', async () => {
    const onToggle = vi.fn();
    const { rerender } = render(<MovieCard movie={movie} planned={false} onTogglePlanned={onToggle} />);

    const button = screen.getByRole('button', { name: 'Буду смотреть' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith(true);

    rerender(<MovieCard movie={movie} planned onTogglePlanned={onToggle} />);
    expect(screen.getByRole('button', { name: 'Буду смотреть' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does not offer the action for a watched title', () => {
    render(<MovieCard movie={movie} watched />);
    expect(screen.getByRole('button', { name: 'Буду смотреть' })).toBeDisabled();
  });

  it('keeps both actions in a wrapping container that cannot overflow', () => {
    render(<MovieCard movie={movie} />);
    const plan = screen.getByRole('button', { name: 'Буду смотреть' });
    const watched = screen.getByRole('button', { name: 'Отметить просмотренным' });
    expect(plan.closest('div')?.className).toContain('flex-wrap');
    expect(plan.className).toContain('min-w-0');
    expect(watched.className).toContain('min-w-0');
  });
});

const record: WatchedRecord = {
  id: 3,
  movie,
  rating: 8.5,
  watchedAt: '2026-01-01',
};

describe('FilmDetail watch-later action', () => {
  function renderDetail(props: { initialRecord?: WatchedRecord | null; initialWatchlistId?: number | null } = {}) {
    return render(
      <ToastProvider>
        <FilmDetail movie={movie} {...props} />
      </ToastProvider>,
    );
  }

  it('adds the title to the watch-later list', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ id: 5 }) }));
    vi.stubGlobal('fetch', fetchMock);
    renderDetail();

    const button = screen.getByRole('button', { name: 'Буду смотреть' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Буду смотреть' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/watchlist',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('removes a title already on the list', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);
    renderDetail({ initialWatchlistId: 5 });

    const button = screen.getByRole('button', { name: 'Буду смотреть' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Буду смотреть' })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/watchlist?id=5', { method: 'DELETE' });
  });

  it('cannot plan a watched title', () => {
    renderDetail({ initialRecord: record });
    expect(screen.getByRole('button', { name: 'Буду смотреть' })).toBeDisabled();
  });
});
