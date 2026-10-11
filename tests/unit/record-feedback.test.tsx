import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FilmDetail } from '@/components/features/movie-tracker/FilmDetail';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';
import { ToastProvider } from '@/components/ui/toast';

const movie = {
  tmdbId: 1,
  kind: 'film' as const,
  title: 'Начало',
  year: 2010,
  rating: 8.8,
  genres: ['фантастика'],
  posterUrl: null,
};

const record: WatchedRecord = {
  id: 5,
  movie,
  rating: 8.5,
  comment: 'Отличный фильм',
  watchedAt: '2026-01-01',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderDetail(initialRecord: WatchedRecord | null = null) {
  return render(
    <ToastProvider>
      <FilmDetail movie={movie} initialRecord={initialRecord} />
    </ToastProvider>,
  );
}

async function saveRating() {
  await userEvent.click(screen.getByRole('button', { name: 'Оценить' }));
  const dialog = await screen.findByRole('dialog');
  await userEvent.type(
    within(dialog).getByRole('spinbutton', { name: 'Оценка (0–10)' }),
    '9',
  );
  await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }));
}

describe('FilmDetail record feedback', () => {
  it('shows a success toast when the record is saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ id: 11 }) })),
    );
    renderDetail();

    await saveRating();

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Запись сохранена');
  });

  it('shows an error toast when the save fails and keeps state consistent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) })),
    );
    renderDetail();

    await saveRating();

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось сохранить запись');
    expect(screen.queryByTestId('my-rating')).not.toBeInTheDocument();
  });

  it('shows an error toast when deleting a record fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) })),
    );
    renderDetail(record);

    await userEvent.click(screen.getByRole('button', { name: 'Просмотрено' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось удалить запись');
    await waitFor(() => expect(screen.getByTestId('my-rating')).toBeInTheDocument());
  });
});
