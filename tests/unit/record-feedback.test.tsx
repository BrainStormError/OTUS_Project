import { render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FilmDetail } from '@/components/features/movie-tracker/FilmDetail';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';
import { ToastProvider } from '@/components/ui/toast';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
  usePathname: () => '/',
}));

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
  refreshMock.mockClear();
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

  it('does not re-render the document after a record is removed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) })),
    );
    renderDetail(record);

    await userEvent.click(screen.getByRole('button', { name: 'Просмотрено' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveTextContent('Запись удалена');
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('removes a freshly rated title using the server-assigned id', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 11 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderDetail();

    await saveRating();
    await userEvent.click(screen.getByRole('button', { name: 'Просмотрено' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/records?id=11', { method: 'DELETE' }),
    );
  });

  it('drops the watched state when the server props change', async () => {
    const { rerender } = renderDetail(record);
    expect(screen.getByRole('button', { name: 'Просмотрено' })).toBeInTheDocument();

    await act(async () => {
      rerender(
        <ToastProvider>
          <FilmDetail movie={movie} initialRecord={null} />
        </ToastProvider>,
      );
    });

    expect(screen.getByRole('button', { name: 'Отметить просмотренным' })).toBeInTheDocument();
  });
});
