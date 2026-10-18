import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MyFilmsView } from '@/components/features/movie-tracker/MyFilmsView';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

const longComment = 'Очень длинный комментарий '.repeat(20).trim();

const record: WatchedRecord = {
  id: 1,
  movie: {
    tmdbId: 1,
    kind: 'film',
    title: 'Начало',
    year: 2010,
    rating: 8.8,
    genres: ['фантастика'],
    posterUrl: null,
  },
  rating: 9,
  comment: longComment,
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

describe('RecordsTable expanded content', () => {
  it('wraps a long comment and lets actions wrap below it', async () => {
    render(<MyFilmsView initialRecords={[record]} />);
    const list = screen.getByTestId('my-films');
    await userEvent.click(within(list).getByRole('button', { name: 'Начало' }));

    const comment = within(list).getByText(longComment);
    expect(comment).toHaveClass('break-words');
    expect(comment).toHaveClass('[overflow-wrap:anywhere]');
    expect(comment.closest('td')).toHaveClass('pt-3');

    const actions = within(list).getByRole('button', { name: 'Изменить' }).parentElement!;
    expect(actions).toHaveClass('flex-wrap');
    expect(actions.parentElement).toHaveClass('flex-col');
    expect(actions.parentElement).toHaveClass('sm:flex-row');

    expect(within(list).getByRole('button', { name: 'Изменить' })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });
});

describe('RecordsTable column highlight', () => {
  it('highlights the hovered column and its header, then clears on leaving', () => {
    render(<MyFilmsView initialRecords={[record]} />);
    const list = screen.getByTestId('my-films');

    const ratingHeader = within(list).getByRole('columnheader', { name: /Оценка/ });
    const titleHeader = within(list).getByRole('columnheader', { name: /Название/ });
    const ratingCell = within(list).getByText('9.0').closest('td')!;

    fireEvent.mouseOver(ratingCell);
    expect(ratingHeader).toHaveClass('bg-secondary/40');
    expect(ratingCell).toHaveClass('bg-secondary/40');
    expect(titleHeader).not.toHaveClass('bg-secondary/40');

    fireEvent.mouseLeave(list);
    expect(ratingHeader).not.toHaveClass('bg-secondary/40');
    expect(ratingCell).not.toHaveClass('bg-secondary/40');
  });

  it('keeps the row hover highlight', () => {
    render(<MyFilmsView initialRecords={[record]} />);
    const list = screen.getByTestId('my-films');
    const row = within(list).getByRole('button', { name: 'Начало' }).closest('tr')!;
    expect(row.className).toContain('hover:bg-secondary');
  });
});
