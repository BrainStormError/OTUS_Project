import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { SearchField } from '@/components/features/movie-tracker/SearchField';
import { listMovies } from '@/components/features/movie-tracker/data';
import type { FeedEvent } from '@/components/features/movie-tracker/feed';
import { listSeries } from '@/components/features/movie-tracker/series-data';

const movies = listMovies();

const feedEvents: FeedEvent[] = [
  {
    id: 'e1',
    cursor: 'c1',
    source: 'friend',
    sourceName: 'Мария',
    kind: 'film',
    title: 'Тёмный рыцарь',
    rating: 8.5,
    watchedAt: '2026-08-20',
    href: '/film/155',
    action: 'оценил(а)',
  },
  {
    id: 'e2',
    cursor: 'c2',
    source: 'group',
    sourceName: 'Киновечера',
    kind: 'series',
    title: 'Во все тяжкие',
    rating: 9,
    watchedAt: '2026-08-24',
    href: '/groups/g1',
    action: 'оценил(а) в группе',
  },
];

async function openFilter(label: string) {
  await userEvent.click(screen.getByText(label));
  return screen.getByRole('group', { name: label });
}

describe('SearchField filters', () => {
  it('submits the active filters', async () => {
    const onSearch = vi.fn();
    render(
      <SearchField
        movies={movies}
        filters={{ title: 'Начало' }}
        onFiltersChange={() => undefined}
        onSearch={onSearch}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    expect(onSearch).toHaveBeenCalledWith({ title: 'Начало' });
  });

  it('renders the panel content without any activation and no standalone search field', () => {
    render(<SearchField movies={movies} filters={{}} onFiltersChange={() => undefined} />);
    expect(screen.getByText('Поиск')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Жанр')).toBeInTheDocument();
  });

  it('groups active values per filter with per-value removal and clears them on reset', async () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <SearchField movies={movies} filters={{}} onFiltersChange={onFiltersChange} />,
    );

    rerender(
      <SearchField
        movies={movies}
        filters={{ genre: ['фантастика', 'драма'] }}
        onFiltersChange={onFiltersChange}
      />,
    );
    const chips = screen.getByTestId('filter-chips');
    const genreBlock = within(chips).getByTestId('filter-block-genre');
    expect(within(genreBlock).getByText('Жанр:')).toBeInTheDocument();
    expect(within(genreBlock).getByText('фантастика')).toBeInTheDocument();
    expect(within(genreBlock).getByText('драма')).toBeInTheDocument();

    await userEvent.click(
      within(genreBlock).getByRole('button', { name: 'Удалить фильтр Жанр: фантастика' }),
    );
    expect(onFiltersChange).toHaveBeenCalledWith({ genre: ['драма'] });

    await userEvent.click(within(chips).getByRole('button', { name: 'Сбросить' }));
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  it('derives genre, actor, director, and year options from the provided movies', async () => {
    render(<SearchField movies={movies} filters={{}} onFiltersChange={() => undefined} />);

    const genre = await openFilter('Жанр');
    expect(within(genre).getByRole('checkbox', { name: 'фантастика' })).toBeInTheDocument();

    const director = await openFilter('Режиссёр');
    expect(within(director).getByRole('checkbox', { name: 'Квентин Тарантино' })).toBeInTheDocument();

    const year = await openFilter('Год');
    expect(within(year).getByRole('checkbox', { name: '1994' })).toBeInTheDocument();

    expect(screen.getByLabelText('Название').tagName).toBe('INPUT');
  });

  it('adds and removes several values within one filter', async () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <SearchField movies={movies} filters={{}} onFiltersChange={onFiltersChange} />,
    );
    const genre = await openFilter('Жанр');
    await userEvent.click(within(genre).getByRole('checkbox', { name: 'драма' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма'] });

    rerender(
      <SearchField
        movies={movies}
        filters={{ genre: ['драма'] }}
        onFiltersChange={onFiltersChange}
      />,
    );
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Жанр' })).getByRole('checkbox', {
        name: 'триллер',
      }),
    );
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма', 'триллер'] });

    rerender(
      <SearchField
        movies={movies}
        filters={{ genre: ['драма', 'триллер'] }}
        onFiltersChange={onFiltersChange}
      />,
    );
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Жанр' })).getByRole('checkbox', { name: 'драма' }),
    );
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['триллер'] });
  });
});

describe('HomeView', () => {
  it('shows the server-fed social feed and popular films instead of results before a search', () => {
    render(<HomeView movies={movies} initialFeed={feedEvents} />);
    expect(screen.getByRole('heading', { name: 'Лента активности' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Популярное' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Результаты поиска' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    const feed = screen.getByTestId('social-feed');
    expect(within(feed).getByText('Тёмный рыцарь')).toBeInTheDocument();
    expect(within(feed).getAllByText(/Мария/).length).toBeGreaterThan(0);
    expect(within(feed).getByText('Во все тяжкие')).toBeInTheDocument();
  });

  it('shows the empty feed state when there is no activity', () => {
    render(<HomeView movies={movies} />);
    expect(screen.getByText('Пока нет активности')).toBeInTheDocument();
  });

  it('shows no results while editing filters and results only after submit', async () => {
    render(<HomeView movies={movies} />);
    await userEvent.type(screen.getByLabelText('Название'), 'Матрица');
    expect(screen.queryByRole('region', { name: 'Результаты поиска' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    const results = screen.getByRole('region', { name: 'Результаты поиска' });
    expect(results).toBeInTheDocument();
    expect(within(results).getByText('Матрица')).toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
  });

  it('searches films and series together through the filter panel', async () => {
    render(<HomeView movies={movies} series={listSeries()} />);
    const genre = await openFilter('Жанр');
    await userEvent.click(within(genre).getByRole('checkbox', { name: 'драма' }));

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    const results = screen.getByRole('region', { name: 'Результаты поиска' });
    expect(within(results).getAllByTestId('movie-card').length).toBeGreaterThan(0);
    expect(within(results).getAllByTestId('series-card').length).toBeGreaterThan(0);
    expect(within(results).getByText('Во все тяжкие')).toBeInTheDocument();
  });

  it('applies several values within a filter on submit', async () => {
    render(<HomeView movies={movies} />);
    const genre = await openFilter('Жанр');
    await userEvent.click(within(genre).getByRole('checkbox', { name: 'фантастика' }));
    await userEvent.click(within(genre).getByRole('checkbox', { name: 'анимация' }));

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    expect(screen.getByText('Матрица')).toBeInTheDocument();
    expect(screen.getByText('Унесённые призраками')).toBeInTheDocument();
    expect(screen.queryByText('Форрест Гамп')).not.toBeInTheDocument();
  });
});
