import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeedProvider } from '@/components/features/movie-tracker/feed-stream';
import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { SearchField } from '@/components/features/movie-tracker/SearchField';
import type { FeedEvent } from '@/components/features/movie-tracker/feed';
import type { FilterOption, SearchFilters } from '@/components/features/movie-tracker/types';
import type { CatalogSearchResult } from '@/modules/catalog';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

const genres: FilterOption[] = [
  { value: 'драма', label: 'Драма' },
  { value: 'фантастика', label: 'Фантастика' },
  { value: 'триллер', label: 'Триллер' },
];

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
    createdAt: '2026-08-20T00:00:00.000Z',
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
    createdAt: '2026-08-24T00:00:00.000Z',
    href: '/groups/1',
    action: 'оценил(а) в группе',
  },
];

type PageEntry = { items: CatalogSearchResult[]; hasMore?: boolean };

function stubApi({
  genres: genreItems = [],
  pages = {},
}: {
  genres?: { id: number; name: string }[];
  pages?: Record<number, PageEntry>;
} = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    const body =
      url.pathname === '/api/genres'
        ? { items: genreItems }
        : (() => {
            const page = Number(url.searchParams.get('page') ?? '1');
            const entry = pages[page] ?? { items: [] };
            return { items: entry.items, page, hasMore: Boolean(entry.hasMore) };
          })();
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
  it('submits the active filters through a full-width button below the grid', async () => {
    const onSearch = vi.fn();
    render(
      <SearchField filters={{ title: 'Начало' }} onFiltersChange={() => undefined} onSearch={onSearch} genres={genres} />,
    );
    const button = screen.getByRole('button', { name: 'Найти' });
    expect(button.className).toContain('w-full');
    const header = screen.getByText('Поиск').parentElement!;
    expect(within(header).queryByRole('button', { name: 'Найти' })).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(onSearch).toHaveBeenCalledWith({ title: 'Начало' });
  });

  it('renders the panel content without any activation and no standalone search field', () => {
    render(<SearchField filters={{}} onFiltersChange={() => undefined} genres={genres} />);
    expect(screen.getByText('Поиск')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Жанр')).toBeInTheDocument();
  });

  it('groups active values per filter with per-value removal and clears them on reset', async () => {
    const onFiltersChange = vi.fn();
    render(
      <SearchField
        filters={{ genre: ['драма', 'фантастика'], yearFrom: '2000', yearTo: '2010' }}
        onFiltersChange={onFiltersChange}
        genres={genres}
      />,
    );
    const chips = screen.getByTestId('filter-chips');
    const genreBlock = within(chips).getByTestId('filter-block-genre');
    expect(within(genreBlock).getByText('Жанр:')).toBeInTheDocument();
    expect(within(genreBlock).getByText('Драма')).toBeInTheDocument();
    expect(within(genreBlock).getByText('Фантастика')).toBeInTheDocument();

    const yearBlock = within(chips).getByTestId('filter-block-yearFrom');
    expect(within(yearBlock).getByText('Год:')).toBeInTheDocument();
    expect(within(yearBlock).getByText('с 2000')).toBeInTheDocument();
    expect(within(yearBlock).getByText('по 2010')).toBeInTheDocument();

    await userEvent.click(
      within(genreBlock).getByRole('button', { name: 'Удалить фильтр Жанр: Фантастика' }),
    );
    expect(onFiltersChange).toHaveBeenCalledWith({
      genre: ['драма'],
      yearFrom: '2000',
      yearTo: '2010',
    });

    await userEvent.click(within(chips).getByRole('button', { name: 'Сбросить' }));
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  it('removes either year bound individually while the other filters stay', async () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <SearchField
        filters={{ genre: ['драма'], yearFrom: '2000', yearTo: '2010' }}
        onFiltersChange={onFiltersChange}
        genres={genres}
      />,
    );
    const chips = screen.getByTestId('filter-chips');
    await userEvent.click(within(chips).getByRole('button', { name: 'Удалить фильтр Год: 2000' }));
    expect(onFiltersChange).toHaveBeenCalledWith({
      genre: ['драма'],
      yearFrom: undefined,
      yearTo: '2010',
    });

    rerender(
      <SearchField
        filters={{ genre: ['драма'], yearTo: '2010' }}
        onFiltersChange={onFiltersChange}
        genres={genres}
      />,
    );
    await userEvent.click(
      within(screen.getByTestId('filter-chips')).getByRole('button', { name: 'Удалить фильтр Год: 2010' }),
    );
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма'], yearTo: undefined });
  });

  it('renders a manual year input with "с"/"по" hints on its own row and no increment or decrement controls', () => {
    render(<SearchField filters={{}} onFiltersChange={() => undefined} genres={genres} />);
    expect((screen.getByLabelText('Год (с)') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Год (по)') as HTMLInputElement).value).toBe('');
    expect(screen.getByPlaceholderText('с')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('по')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Увеличить год/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Уменьшить год/ })).not.toBeInTheDocument();

    const grid = screen.getByText('Название').closest('label')!.parentElement!;
    expect(grid.className).toContain('sm:grid-cols-2');
    const yearRange = screen.getByText('Год').parentElement!;
    expect(yearRange.className).toContain('sm:col-span-2');
    expect(screen.getByLabelText('Год (с)').parentElement!.className).toContain('sm:grid-cols-2');
  });

  it('resets a year bound typed above the current calendar year on blur and leaves a value within the cap', async () => {
    function Harness() {
      const [filters, setFilters] = useState<SearchFilters>({});
      return <SearchField filters={filters} onFiltersChange={setFilters} genres={genres} />;
    }
    const currentYear = new Date().getFullYear();
    render(<Harness />);
    const from = screen.getByLabelText('Год (с)') as HTMLInputElement;
    expect(from).toHaveAttribute('max', String(currentYear));

    await userEvent.type(from, String(currentYear + 1));
    expect(from.value).toBe(String(currentYear + 1));

    await userEvent.tab();
    expect(from.value).toBe(String(currentYear));

    await userEvent.clear(from);
    await userEvent.type(from, String(currentYear - 1));
    await userEvent.tab();
    expect(from.value).toBe(String(currentYear - 1));
  });

  it('clears the upper bound when the lower bound is entered above it and keeps it otherwise', () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <SearchField filters={{ yearTo: '2000' }} onFiltersChange={onFiltersChange} genres={genres} />,
    );
    fireEvent.change(screen.getByLabelText('Год (с)'), { target: { value: '2010' } });
    expect(onFiltersChange).toHaveBeenLastCalledWith({ yearFrom: '2010', yearTo: undefined });

    rerender(
      <SearchField filters={{ yearTo: '2010' }} onFiltersChange={onFiltersChange} genres={genres} />,
    );
    fireEvent.change(screen.getByLabelText('Год (с)'), { target: { value: '2000' } });
    expect(onFiltersChange).toHaveBeenLastCalledWith({ yearFrom: '2000', yearTo: '2010' });
  });

  it('derives genre options from the provided options and omits actor/director filters', async () => {
    render(<SearchField filters={{}} onFiltersChange={() => undefined} genres={genres} />);

    const genre = await openFilter('Жанр');
    expect(within(genre).getByRole('checkbox', { name: 'Драма' })).toBeInTheDocument();

    expect(screen.getByLabelText('Год (с)').tagName).toBe('INPUT');
    expect(screen.getByLabelText('Год (по)').tagName).toBe('INPUT');
    expect(screen.queryByText('Актёр')).not.toBeInTheDocument();
    expect(screen.queryByText('Режиссёр')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Название').tagName).toBe('INPUT');
  });

  it('adds and removes several values within one filter', async () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <SearchField filters={{}} onFiltersChange={onFiltersChange} genres={genres} />,
    );
    const genre = await openFilter('Жанр');
    await userEvent.click(within(genre).getByRole('checkbox', { name: 'Драма' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма'] });

    rerender(
      <SearchField filters={{ genre: ['драма'] }} onFiltersChange={onFiltersChange} genres={genres} />,
    );
    const next = await openFilter('Жанр');
    await userEvent.click(within(next).getByRole('checkbox', { name: 'Триллер' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['драма', 'триллер'] });

    rerender(
      <SearchField
        filters={{ genre: ['драма', 'триллер'] }}
        onFiltersChange={onFiltersChange}
        genres={genres}
      />,
    );
    const last = await openFilter('Жанр');
    await userEvent.click(within(last).getByRole('checkbox', { name: 'Драма' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ genre: ['триллер'] });
  });
});

describe('HomeView', () => {
  it('shows the social feed and popular films instead of results before a search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input), 'http://localhost');
        const body = url.pathname === '/api/feed' ? { items: feedEvents } : { items: [] };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    );
    render(
      <FeedProvider>
        <HomeView popularFilms={popularFilms} />
      </FeedProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Лента активности' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Популярное' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Результаты поиска' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Начало')).toBeInTheDocument();

    const feed = await screen.findByTestId('social-feed');
    expect(within(feed).getByText('Тёмный рыцарь')).toBeInTheDocument();
    expect(within(feed).getAllByText(/Мария/).length).toBeGreaterThan(0);
    expect(within(feed).getByText('Во все тяжкие')).toBeInTheDocument();
  });

  it('shows the empty feed state when there is no activity', () => {
    render(<HomeView popularFilms={popularFilms} />);
    expect(screen.getByText('Пока нет активности')).toBeInTheDocument();
  });

  it('shows no results while editing filters and results only after submit', async () => {
    stubApi({ pages: { 1: { items: [item({ externalId: '603', title: 'Матрица' })] } } });
    render(<HomeView popularFilms={popularFilms} />);
    await userEvent.type(screen.getByLabelText('Название'), 'Матрица');
    expect(screen.queryByRole('region', { name: 'Результаты поиска' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    const results = await screen.findByRole('region', { name: 'Результаты поиска' });
    expect(within(results).getByText('Матрица')).toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
  });

  it('offers a kind selector that scopes the search', async () => {
    const fetchMock = stubApi({
      pages: { 1: { items: [item({ externalId: '1396', kind: 'series', title: 'Во все тяжкие' })] } },
    });
    render(<HomeView popularFilms={popularFilms} />);

    await userEvent.click(screen.getByRole('button', { name: 'Сериалы' }));
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));

    const results = await screen.findByRole('region', { name: 'Результаты поиска' });
    expect(within(results).getByText('Во все тяжкие')).toBeInTheDocument();
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('kind=series'))).toBe(true);
  });

  it('presents an empty state when a search matches nothing', async () => {
    stubApi({ pages: { 1: { items: [] } } });
    render(<HomeView popularFilms={popularFilms} />);
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('appends the next page and resets to the first page on a new search', async () => {
    stubApi({
      pages: {
        1: { items: [item({ externalId: '1', title: 'Первый' })], hasMore: true },
        2: { items: [item({ externalId: '2', title: 'Второй' })], hasMore: false },
      },
    });
    render(<HomeView popularFilms={popularFilms} />);
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));

    const results = await screen.findByRole('region', { name: 'Результаты поиска' });
    expect(within(results).getByText('Первый')).toBeInTheDocument();

    await userEvent.click(within(results).getByRole('button', { name: 'Показать ещё' }));
    expect(await within(results).findByText('Второй')).toBeInTheDocument();
    expect(within(results).getByText('Первый')).toBeInTheDocument();
    expect(within(results).queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: 'Результаты поиска' })).queryByText('Второй'),
      ).not.toBeInTheDocument(),
    );
  });

  it('draws genre options from the props without a client request', async () => {
    const fetchMock = stubApi();
    render(
      <HomeView
        popularFilms={popularFilms}
        genres={[
          { value: '28', label: 'Боевик' },
          { value: '878', label: 'Фантастика' },
        ]}
      />,
    );
    const genre = await openFilter('Жанр');
    expect(await within(genre).findByRole('checkbox', { name: 'Боевик' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сериалы' }));
    const seriesGenre = await openFilter('Жанр');
    expect(await within(seriesGenre).findByRole('checkbox', { name: 'Боевик' })).toBeInTheDocument();

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('/api/genres'))).toBe(false);
  });

  it('toggles the watch-later action on a search-result card', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost');
      const body =
        url.pathname === '/api/genres'
          ? { items: [] }
          : url.pathname === '/api/watchlist'
            ? { id: 5 }
            : { items: [item({ externalId: '27205', title: 'Начало' })], page: 1, hasMore: false };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<HomeView popularFilms={popularFilms} />);

    await userEvent.click(screen.getByRole('button', { name: 'Найти' }));
    const results = await screen.findByRole('region', { name: 'Результаты поиска' });
    const card = within(results).getByTestId('movie-card');

    const planButton = () => within(card).getByRole('button', { name: 'Буду смотреть' });
    expect(planButton()).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(planButton());
    await waitFor(() => expect(planButton()).toHaveAttribute('aria-pressed', 'true'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/watchlist',
      expect.objectContaining({ method: 'POST' }),
    );

    await userEvent.click(planButton());
    await waitFor(() => expect(planButton()).toHaveAttribute('aria-pressed', 'false'));
    expect(fetchMock).toHaveBeenCalledWith('/api/watchlist?id=5', { method: 'DELETE' });
  });
});
