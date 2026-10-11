import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { SearchField } from '@/components/features/movie-tracker/SearchField';
import type { FeedEvent } from '@/components/features/movie-tracker/feed';
import type { FilterOption } from '@/components/features/movie-tracker/types';
import type { CatalogSearchResult } from '@/modules/catalog';

const genres: FilterOption[] = [
  { value: 'драма', label: 'Драма' },
  { value: 'фантастика', label: 'Фантастика' },
  { value: 'триллер', label: 'Триллер' },
];
const years = [2010, 1999];

function item(over: Partial<CatalogSearchResult> & { externalId: string }): CatalogSearchResult {
  return {
    kind: 'film',
    title: 'Фильм',
    year: 2010,
    posterUrl: null,
    externalRating: 7,
    genres: [],
    genreIds: [],
    ...over,
  };
}

const popularFilms: CatalogSearchResult[] = [
  item({ externalId: '27205', title: 'Начало', genreIds: [878], genres: ['Фантастика'] }),
  item({ externalId: '603', title: 'Матрица', genreIds: [878], genres: ['Фантастика'] }),
];

const feedEvents: FeedEvent[] = [
  {
    id: 1,
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
    id: 2,
    cursor: 'c2',
    source: 'group',
    sourceName: 'Киновечера',
    kind: 'series',
    title: 'Во все тяжкие',
    rating: 9,
    watchedAt: '2026-08-24',
    href: '/groups/1',
    action: 'оценил(а) в группе',
  },
];

function mockSearch(items: CatalogSearchResult[] = [], genres: { id: number; name: string }[] = []) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes('/api/genres') ? { items: genres } : { items };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openFilter(label: string) {
  await userEvent.click(screen.getByText(label));
  return screen.getByRole('group', { name: label });
}

describe('SearchField filters', () => {
  it('submits the active filters', async () => {
    const onSearch = vi.fn();
    render(
      <SearchField
        filters={{ title: 'Начало' }}
        onFiltersChange={() => undefined}
        onSearch={onSearch}
        genres={genres}
        years={years}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    expect(onSearch).toHaveBeenCalledWith({ title: 'Начало' });
  });

  it('renders the panel content without any activation and no standalone search field', () => {
    render(<SearchField filters={{}} onFiltersChange={() => undefined} genres={genres} years={years} />);
    expect(screen.getByText('Поиск')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Жанр')).toBeInTheDocument();
  });

  it('groups active values per filter with per-value removal and clears them on reset', async () => {
    const onFiltersChange = vi.fn();
    render(
      <SearchField
        filters={{ genre: ['драма', 'фантастика'] }}
        onFiltersChange={onFiltersChange}
        genres={genres}
        years={years}
      />,
    );
    const chips = screen.getByTestId('filter-chips');
    const genreBlock = within(chips).getByTestId('filter-block-genre');
    expect(within(genreBlock).getByText('Жанр:')).toBeInTheDocument();
    expect(within(genreBlock).getByText('Драма')).toBeInTheDocument();
    expect(within(genreBlock).getByText('Фантастика')).toBeInTheDocument();

    await userEvent.click(
      within(genreBlock).getByRole('button', { name: 'Удалить фильтр Жанр: Фантастика' }),
    );
    expect(onFiltersChange).toHaveBeenCalledWith({ genre: ['драма'] });

    await userEvent.click(within(chips).getByRole('button', { name: 'Сбросить' }));
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  it('derives genre and year options from the provided options and omits actor/director filters', async () => {
    render(<SearchField filters={{}} onFiltersChange={() => undefined} genres={genres} years={years} />);

    const genre = await openFilter('Жанр');
    expect(within(genre).getByRole('checkbox', { name: 'Драма' })).toBeInTheDocument();

    expect(screen.getByLabelText('Год').tagName).toBe('INPUT');
    expect(screen.queryByText('Актёр')).not.toBeInTheDocument();
    expect(screen.queryByText('Режиссёр')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Название').tagName).toBe('INPUT');
  });

  it('adds and removes several values within one filter', async () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <SearchField
        filters={{}}
        onFiltersChange={onFiltersChange}
        genres={genres}
        years={years}
      />,
    );
    const genre = await openFilter('Жанр');
    await userEvent.click(within(genre).getByRole('checkbox', { name: 'Драма' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма'] });

    rerender(
      <SearchField
        filters={{ genre: ['драма'] }}
        onFiltersChange={onFiltersChange}
        genres={genres}
        years={years}
      />,
    );
    const next = await openFilter('Жанр');
    await userEvent.click(within(next).getByRole('checkbox', { name: 'Триллер' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма', 'триллер'] });

    rerender(
      <SearchField
        filters={{ genre: ['драма', 'триллер'] }}
        onFiltersChange={onFiltersChange}
        genres={genres}
        years={years}
      />,
    );
    const last = await openFilter('Жанр');
    await userEvent.click(within(last).getByRole('checkbox', { name: 'Драма' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['триллер'] });
  });

  it('removes the year chip through its control while the other filters stay', async () => {
    const onFiltersChange = vi.fn();
    render(
      <SearchField
        filters={{ genre: ['драма'], year: '2010' }}
        onFiltersChange={onFiltersChange}
        genres={genres}
        years={years}
      />,
    );
    const chips = screen.getByTestId('filter-chips');
    await userEvent.click(
      within(chips).getByRole('button', { name: 'Удалить фильтр Год: 2010' }),
    );
    expect(onFiltersChange).toHaveBeenCalledWith({ genre: ['драма'] });
  });

  it('selects the current year on the first step from the empty state', async () => {
    const onFiltersChange = vi.fn();
    const currentYear = new Date().getFullYear();
    render(
      <SearchField filters={{}} onFiltersChange={onFiltersChange} genres={genres} years={years} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Увеличить год' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ year: String(currentYear) });
  });

  it('decrements from the empty state to the current year', async () => {
    const onFiltersChange = vi.fn();
    const currentYear = new Date().getFullYear();
    render(
      <SearchField filters={{}} onFiltersChange={onFiltersChange} genres={genres} years={years} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Уменьшить год' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ year: String(currentYear) });
  });

  it('accepts a year outside the available data', async () => {
    const onFiltersChange = vi.fn();
    render(
      <SearchField
        filters={{ year: '2050' }}
        onFiltersChange={onFiltersChange}
        genres={genres}
        years={years}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Увеличить год' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ year: '2051' });
  });
});

describe('HomeView', () => {
  it('shows the server-fed social feed and popular films instead of results before a search', () => {
    render(<HomeView popularFilms={popularFilms} initialFeed={feedEvents} />);
    expect(screen.getByRole('heading', { name: 'Лента активности' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Популярное' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Результаты поиска' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Начало')).toBeInTheDocument();

    const feed = screen.getByTestId('social-feed');
    expect(within(feed).getByText('Тёмный рыцарь')).toBeInTheDocument();
    expect(within(feed).getAllByText(/Мария/).length).toBeGreaterThan(0);
    expect(within(feed).getByText('Во все тяжкие')).toBeInTheDocument();
  });

  it('shows the empty feed state when there is no activity', () => {
    render(<HomeView popularFilms={popularFilms} />);
    expect(screen.getByText('Пока нет активности')).toBeInTheDocument();
  });

  it('shows no results while editing filters and results only after submit', async () => {
    mockSearch([item({ externalId: '603', title: 'Матрица' })]);
    render(<HomeView popularFilms={popularFilms} />);
    await userEvent.type(screen.getByLabelText('Название'), 'Матрица');
    expect(screen.queryByRole('region', { name: 'Результаты поиска' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    const results = await screen.findByRole('region', { name: 'Результаты поиска' });
    expect(within(results).getByText('Матрица')).toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
  });

  it('offers a kind selector that scopes the search', async () => {
    const fetchMock = mockSearch([item({ externalId: '1396', kind: 'series', title: 'Во все тяжкие' })]);
    render(<HomeView popularFilms={popularFilms} />);

    await userEvent.click(screen.getByRole('button', { name: 'Сериалы' }));
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));

    const results = await screen.findByRole('region', { name: 'Результаты поиска' });
    expect(within(results).getByText('Во все тяжкие')).toBeInTheDocument();
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('kind=series'))).toBe(true);
  });

  it('presents an empty state when a search matches nothing', async () => {
    mockSearch([]);
    render(<HomeView popularFilms={popularFilms} />);
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('offers the full stored genre catalog, not only genres in the popular results', async () => {
    mockSearch([], [
      { id: 28, name: 'Боевик' },
      { id: 878, name: 'Фантастика' },
    ]);
    render(<HomeView popularFilms={popularFilms} />);
    const genre = await openFilter('Жанр');
    expect(await within(genre).findByRole('checkbox', { name: 'Боевик' })).toBeInTheDocument();
  });
});
