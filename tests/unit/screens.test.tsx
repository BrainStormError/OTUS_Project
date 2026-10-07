import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FriendsView } from '@/components/features/movie-tracker/FriendsView';
import { GroupsView } from '@/components/features/movie-tracker/GroupsView';
import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { MyFilmsView } from '@/components/features/movie-tracker/MyFilmsView';
import { MySeriesView } from '@/components/features/movie-tracker/MySeriesView';
import { ProfileView } from '@/components/features/movie-tracker/ProfileView';
import { RecordView } from '@/components/features/movie-tracker/RecordView';
import { SettingsView } from '@/components/features/movie-tracker/SettingsView';
import { StatisticsView } from '@/components/features/movie-tracker/StatisticsView';
import { groups, listMovies, searchGroups } from '@/components/features/movie-tracker/data';
import { listSeries } from '@/components/features/movie-tracker/series-data';
import type {
  FriendRequest,
  PublicUser,
  SeriesRecord,
  UserStats,
  WatchedRecord,
} from '@/components/features/movie-tracker/types';

const movies = listMovies();
const seriesCatalog = listSeries();

const filmRecords: WatchedRecord[] = [
  { id: 1, movie: movies[0]!, rating: 9, comment: 'Отличная структура сна.', watchedAt: '2026-08-12' },
  { id: 2, movie: movies[3]!, rating: 8.5, watchedAt: '2026-08-02' },
  { id: 3, movie: movies[4]!, rating: 7.5, comment: 'Тёплое кино.', watchedAt: '2026-07-21' },
  { id: 4, movie: movies[6]!, rating: 9.5, watchedAt: '2026-07-05' },
];

const seriesRecords: SeriesRecord[] = [
  {
    id: 's1',
    series: seriesCatalog[1]!,
    mode: 'whole',
    seriesRating: 9.4,
    seriesComment: 'Мощно.',
    watchedAt: '2026-08-10',
  },
  { id: 's2', series: seriesCatalog[0]!, mode: 'whole', seriesRating: 9, watchedAt: '2026-07-15' },
  { id: 's3', series: seriesCatalog[3]!, mode: 'whole', seriesRating: 7, watchedAt: '2026-06-01' },
];

const statsFixture: UserStats = {
  count: 4,
  genres: [{ genre: 'драма', count: 2 }],
  years: [{ year: 2010, count: 1 }],
};

const maria: PublicUser = {
  id: 2,
  handle: 'maria',
  name: 'Мария',
  isFriend: true,
  stats: statsFixture,
  recent: [],
};
const ivan: PublicUser = {
  id: 3,
  handle: 'ivan',
  name: 'Иван',
  statsHidden: true,
  stats: statsFixture,
  recent: [],
};
const secret: PublicUser = {
  id: 4,
  handle: 'secret',
  name: 'Скрытый пользователь',
  profileHidden: true,
  statsHidden: true,
  stats: statsFixture,
  recent: [],
};
const nina: PublicUser = { id: 5, handle: 'nina', name: 'Нина', stats: statsFixture, recent: [] };
const ownProfile: PublicUser = {
  id: 1,
  handle: 'me',
  name: 'Алексей',
  stats: statsFixture,
  recent: filmRecords,
};

const friendRequests: FriendRequest[] = [
  { id: 1, user: nina },
  { id: 2, user: ivan },
];
const friends: PublicUser[] = [maria];
const outgoingRequests: FriendRequest[] = [{ id: 1, user: nina }];

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

describe('My Films and records', () => {
  it('lists watched records as a table with title, rating, and date, and no permanent edit action', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    const list = screen.getByTestId('my-films');
    expect(within(list).getByText('Начало')).toBeInTheDocument();
    expect(within(list).getByText('9.0')).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Название/ })).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Дата просмотра/ })).toBeInTheDocument();
    expect(within(list).queryByRole('link')).not.toBeInTheDocument();
    expect(within(list).queryByRole('button', { name: 'Изменить' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: 'Начало' }));
    expect(within(list).getByRole('button', { name: 'Изменить' })).toBeInTheDocument();
  });

  it('orders by watch date newest first by default and sorts by a column header', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    const list = screen.getByTestId('my-films');
    const dateHeader = within(list).getByRole('columnheader', { name: /Дата просмотра/ });
    expect(dateHeader).toHaveAttribute('aria-sort', 'descending');

    const dataRows = () => within(list).getAllByRole('row').slice(1);
    expect(within(dataRows()[0]!).getByText('Начало')).toBeInTheDocument();

    const ratingButton = within(list).getByRole('button', { name: /Оценка/ });
    await userEvent.click(ratingButton);
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(within(dataRows()[0]!).getByText('Форрест Гамп')).toBeInTheDocument();

    await userEvent.click(ratingButton);
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(within(dataRows()[0]!).getByText('Унесённые призраками')).toBeInTheDocument();
  });

  it('expands a comment in place and shows a placeholder when empty', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    const list = screen.getByTestId('my-films');
    const row = within(list).getByRole('button', { name: 'Начало' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(within(list).getByText('Отличная структура сна.')).toBeVisible();

    const emptyRow = within(list).getByRole('button', { name: 'Матрица' });
    await userEvent.click(emptyRow);
    expect(within(list).getByText('Нет комментария')).toBeVisible();
  });

  it('selects a record by clicking any part of the row and highlights it on hover', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    const list = screen.getByTestId('my-films');
    const title = within(list).getByRole('button', { name: 'Начало' });
    const row = title.closest('tr')!;
    expect(row.className).toContain('hover:bg-secondary');
    expect(title).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(within(list).getByText('2026-08-12'));
    expect(within(list).getByRole('button', { name: 'Начало' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(within(list).getByText('Отличная структура сна.')).toBeVisible();
  });

  it('filters the list live through the filter panel', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    const list = screen.getByTestId('my-films');
    await userEvent.type(screen.getByLabelText('Название'), 'Матрица');
    expect(within(list).getByText('Матрица')).toBeInTheDocument();
    expect(within(list).queryByText('Начало')).not.toBeInTheDocument();
  });

  it('scopes genre, actor, director, and year options to watched films', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);

    await userEvent.click(screen.getByText('Жанр'));
    const genre = screen.getByRole('group', { name: 'Жанр' });
    expect(within(genre).getByRole('checkbox', { name: 'фантастика' })).toBeInTheDocument();
    expect(within(genre).queryByRole('checkbox', { name: 'триллер' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Режиссёр'));
    const director = screen.getByRole('group', { name: 'Режиссёр' });
    expect(within(director).getByRole('checkbox', { name: 'Кристофер Нолан' })).toBeInTheDocument();
    expect(
      within(director).queryByRole('checkbox', { name: 'Квентин Тарантино' }),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText('Название').tagName).toBe('INPUT');
  });

  it('adds a record through the modal', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    const picker = screen.getByRole('dialog');
    await userEvent.click(within(picker).getByRole('button', { name: /Паразиты/ }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^Оценка \(/), '8');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить' }));
    const list = screen.getByTestId('my-films');
    expect(await within(list).findByText('Паразиты')).toBeInTheDocument();
  });

  it('edits a record and deletes it only after confirmation', async () => {
    render(<MyFilmsView initialRecords={filmRecords} />);
    const list = screen.getByTestId('my-films');

    await userEvent.click(within(list).getByRole('button', { name: 'Начало' }));
    expect(within(list).getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: 'Изменить' }));
    const editDialog = screen.getByRole('dialog');
    await userEvent.clear(within(editDialog).getByLabelText(/^Оценка \(/));
    await userEvent.type(within(editDialog).getByLabelText(/^Оценка \(/), '7');
    await userEvent.click(within(editDialog).getByRole('button', { name: 'Сохранить' }));
    expect(await within(list).findByText('7.0')).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: 'Удалить' }));
    const confirmDialog = screen.getByRole('dialog');
    expect(within(confirmDialog).getByText(/Удалить запись\?/)).toBeInTheDocument();
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Отмена' }));
    expect(within(list).getByText('Начало')).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: 'Удалить' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить' }),
    );
    await waitFor(() => expect(within(list).queryByText('Начало')).not.toBeInTheDocument());
  });

  it('opens an individual record and shows an empty state for a missing one', () => {
    const { rerender } = render(<RecordView record={filmRecords[0]!} />);
    expect(screen.getByRole('heading', { name: 'Начало' })).toBeInTheDocument();
    expect(screen.getByText(/Дата просмотра:/)).toBeInTheDocument();

    rerender(<RecordView record={null} />);
    expect(screen.getByText('Запись не найдена')).toBeInTheDocument();
  });

  it('renders records passed from the server without a browser sample', async () => {
    render(
      <MyFilmsView
        initialRecords={[
          {
            id: 680,
            movie: {
              tmdbId: 680,
              title: 'Криминальное чтиво',
              year: 1994,
              rating: 8.5,
              genres: ['драма'],
            },
            rating: 8.5,
            comment: 'Классика',
            watchedAt: '2026-09-01',
          },
        ]}
      />,
    );
    const list = screen.getByTestId('my-films');
    expect(within(list).getByText('Криминальное чтиво')).toBeInTheDocument();
    expect(within(list).getByText('2026-09-01')).toBeInTheDocument();
  });
});

describe('My Series', () => {
  it('lists series with title, rating, and date columns and sorts by header', async () => {
    render(<MySeriesView initialRecords={seriesRecords} />);
    const list = screen.getByTestId('my-series');
    expect(within(list).getByRole('columnheader', { name: /Название/ })).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Дата просмотра/ })).toBeInTheDocument();

    const dataRows = () => within(list).getAllByRole('row').slice(1);
    expect(within(dataRows()[0]!).getByText('Чернобыль')).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: /Оценка/ }));
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(within(dataRows()[0]!).getByText('Тьма')).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: /Название/ }));
    expect(within(list).getByRole('columnheader', { name: /Название/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('expands a whole-series row in place without seasons or episodes', async () => {
    render(<MySeriesView initialRecords={seriesRecords} />);
    const list = screen.getByTestId('my-series');
    const button = within(list).getByRole('button', { name: 'Чернобыль' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(within(list).getByText('Мощно.')).toBeVisible();
    expect(within(list).queryByText(/Сезон/)).not.toBeInTheDocument();
    expect(within(list).queryByText(/^Серия/)).not.toBeInTheDocument();
  });

  it('adds a series through the whole-series rating modal', async () => {
    render(<MySeriesView initialRecords={seriesRecords} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    const picker = screen.getByRole('dialog');
    expect(within(picker).getByText('Поиск')).toBeInTheDocument();
    expect(within(picker).queryByText('Актёр')).not.toBeInTheDocument();
    expect(within(picker).queryByText('Режиссёр')).not.toBeInTheDocument();
    await userEvent.click(within(picker).getByRole('button', { name: /Игра в кальмара/ }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^Оценка \(/), '8');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить' }));
    const list = screen.getByTestId('my-series');
    expect(await within(list).findByText('Игра в кальмара')).toBeInTheDocument();
  });

  it('applies add-modal filters only after Найти', async () => {
    render(<MySeriesView initialRecords={seriesRecords} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    const picker = screen.getByRole('dialog');

    await userEvent.click(within(picker).getByText('Жанр'));
    await userEvent.click(within(picker).getByRole('checkbox', { name: 'фантастика' }));

    expect(within(picker).getByRole('button', { name: /Во все тяжкие/ })).toBeInTheDocument();
    await userEvent.click(within(picker).getByRole('button', { name: 'Найти' }));
    expect(within(picker).queryByRole('button', { name: /Во все тяжкие/ })).not.toBeInTheDocument();
    expect(within(picker).getByRole('button', { name: /Тьма/ })).toBeInTheDocument();
  });
});

describe('Home watched flow', () => {
  it('marks a film watched through the rating modal', async () => {
    render(<HomeView movies={movies} />);
    const card = screen
      .getAllByTestId('movie-card')
      .find((node) => within(node).queryByText('Тёмный рыцарь'));
    expect(card).toBeDefined();
    await userEvent.click(within(card!).getByRole('button', { name: 'Отметить просмотренным' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Тёмный рыцарь/)).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/^Оценка \(/), '9');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(await screen.findAllByTestId('watched-badge')).toHaveLength(1);
  });

  it('shows a non-interactive watched indicator on watched cards', async () => {
    render(
      <HomeView
        movies={movies}
        initialRecords={[
          { id: 155, movie: movies[1]!, rating: 8.5, watchedAt: '2026-08-20' },
        ]}
      />,
    );
    const badges = await screen.findAllByTestId('watched-badge');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveAttribute('title', 'Просмотрено');
    expect(badges[0]).toHaveAttribute('aria-label', 'Просмотрено');
    expect(badges[0]!.tagName).toBe('SPAN');
  });
});

describe('ProfileView', () => {
  it('shows the own profile with identity, statistics, and activity only', () => {
    render(<ProfileView user={ownProfile} isOwn />);
    expect(screen.getByRole('heading', { name: 'Алексей' })).toBeInTheDocument();
    expect(screen.getByTestId('statistics')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Активность' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Приватность' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Настройки' })).not.toBeInTheDocument();
  });

  it('shows a relationship action on another users profile', () => {
    render(<ProfileView user={maria} isOwn={false} />);
    expect(screen.getByRole('button', { name: 'Добавить в друзья' })).toBeInTheDocument();
  });

  it('shows the restricted state to a non-permitted viewer but not to the owner', () => {
    render(<ProfileView user={secret} isOwn={false} />);
    expect(screen.getByTestId('restricted-profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить в друзья' })).toBeInTheDocument();
  });

  it('restricts statistics for a non-permitted viewer while the owner still sees values', () => {
    const { rerender } = render(<ProfileView user={ivan} isOwn={false} />);
    expect(screen.getByTestId('restricted-statistics')).toBeInTheDocument();

    rerender(<ProfileView user={ivan} isOwn />);
    expect(screen.getByTestId('statistics')).toBeInTheDocument();
  });
});

describe('StatisticsView', () => {
  it('shows three statistics without an average rating card', () => {
    render(<StatisticsView stats={statsFixture} />);
    const cards = screen.getAllByTestId('stat-card');
    expect(cards).toHaveLength(3);
    expect(screen.getByText('Всего фильмов')).toBeInTheDocument();
    expect(screen.queryByText('Средняя оценка')).not.toBeInTheDocument();
    expect(screen.getByText('Любимый жанр')).toBeInTheDocument();
    expect(screen.getByText('Любимый год')).toBeInTheDocument();
  });

  it('shows the restricted state instead of values', () => {
    render(<StatisticsView stats={statsFixture} restricted />);
    expect(screen.getByTestId('restricted-statistics')).toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
  });
});

describe('FriendsView', () => {
  it('shows the pending count and updates the list on accept', async () => {
    render(<FriendsView initialRequests={friendRequests} initialFriends={friends} />);
    expect(screen.getByLabelText('Ожидающих заявок: 2')).toHaveTextContent('2');

    await userEvent.click(screen.getByRole('button', { name: 'Принять заявку от Нина' }));

    expect(screen.getByLabelText('Ожидающих заявок: 1')).toHaveTextContent('1');
    const friendsSection = screen.getByRole('region', { name: 'Мои друзья' });
    expect(within(friendsSection).getByRole('link', { name: /Нина/ })).toBeInTheDocument();
  });
});

describe('SettingsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('persists a privacy change and reflects the saved state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ profileHidden: true, statsHidden: false }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<SettingsView />);
    const profileToggle = screen.getByRole('switch', { name: 'Скрыть профиль' });
    expect(profileToggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(profileToggle);

    expect(profileToggle).toHaveAttribute('aria-checked', 'true');
    expect(await screen.findByText('Сохранено')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/me/privacy',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('rolls back and reports failure when saving fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    render(<SettingsView />);
    const profileToggle = screen.getByRole('switch', { name: 'Скрыть профиль' });

    await userEvent.click(profileToggle);

    expect(await screen.findByText('Не сохранено')).toBeInTheDocument();
    expect(profileToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects theme selection and identity display', async () => {
    render(<SettingsView />);
    const dark = screen.getByRole('radio', { name: 'Тёмная' });
    await userEvent.click(dark);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
    await waitFor(() => expect(dark).toHaveAttribute('aria-checked', 'true'));

    const both = screen.getByRole('radio', { name: 'Имя и тег' });
    await userEvent.click(both);
    expect(both).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem('identity-display')).toBe('both');
  });
});

describe('Scoped search in Friends and Groups', () => {
  function stubUserSearch(overrides: Record<number, string> = {}) {
    const directory = [maria, ivan, nina];
    const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const items = directory
        .filter((user) => user.name.toLowerCase().includes(q))
        .map((user) => ({
          id: user.id,
          name: user.name,
          handle: user.handle,
          relationship:
            overrides[user.id] ??
            (friends.some((friend) => friend.id === user.id) ? 'friend' : 'none'),
        }));
      return Promise.resolve({ ok: true, json: async () => ({ items }) });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('searches own groups first and falls back to non-restricted groups', () => {
    expect(searchGroups('Киновечера', groups).map((group) => group.id)).toEqual([1]);
    expect(searchGroups('Документ', groups).map((group) => group.id)).toEqual([3]);
    expect(searchGroups('Закрытый', groups)).toEqual([]);
  });

  it('matches groups by tag, falling back to non-restricted groups', () => {
    expect(searchGroups('ретро', groups).map((group) => group.id)).toEqual([2]);
    expect(searchGroups('биография', groups).map((group) => group.id)).toEqual([3]);
  });

  it('shows scoped friends in the UI and never leaks hidden profiles', async () => {
    stubUserSearch();
    render(<FriendsView initialRequests={friendRequests} initialFriends={friends} />);
    const searchRegion = screen.getByRole('region', { name: 'Поиск людей' });
    const box = within(searchRegion).getByRole('searchbox', { name: 'Поиск людей' });

    await userEvent.type(box, 'Мария');
    expect(await within(searchRegion).findByRole('link', { name: /Мария/ })).toBeInTheDocument();
    expect(
      within(searchRegion).queryByRole('button', { name: /Добавить/ }),
    ).not.toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Нина');
    expect(
      await within(searchRegion).findByRole('button', { name: 'Добавить Нина' }),
    ).toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Скрытый');
    expect(await within(searchRegion).findByText('Никого не найдено')).toBeInTheDocument();
    expect(within(searchRegion).queryByRole('link', { name: /Скрытый/ })).not.toBeInTheDocument();
  });

  it('sends a request from search and reflects the pending status', async () => {
    const fetchMock = stubUserSearch();
    render(<FriendsView initialRequests={[]} initialFriends={friends} />);
    const searchRegion = screen.getByRole('region', { name: 'Поиск людей' });
    const box = within(searchRegion).getByRole('searchbox', { name: 'Поиск людей' });

    await userEvent.type(box, 'Нина');
    await userEvent.click(await within(searchRegion).findByRole('button', { name: 'Добавить Нина' }));

    expect(await within(searchRegion).findByText('Заявка отправлена')).toBeInTheDocument();
    expect(
      within(searchRegion).queryByRole('button', { name: 'Добавить Нина' }),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/friendships',
      expect.objectContaining({ method: 'POST' }),
    );
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/friendships');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ addresseeId: 5 });
  });

  it('marks pending results without an add action', async () => {
    stubUserSearch({ 5: 'pending_out' });
    render(<FriendsView initialRequests={[]} initialFriends={friends} />);
    const searchRegion = screen.getByRole('region', { name: 'Поиск людей' });
    const box = within(searchRegion).getByRole('searchbox', { name: 'Поиск людей' });

    await userEvent.type(box, 'Нина');

    expect(await within(searchRegion).findByText('Заявка отправлена')).toBeInTheDocument();
    expect(
      within(searchRegion).queryByRole('button', { name: /Добавить/ }),
    ).not.toBeInTheDocument();
  });

  it('renders outgoing requests and withdraws one optimistically', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 1 }) }),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(
      <FriendsView
        initialRequests={[]}
        initialOutgoing={outgoingRequests}
        initialFriends={friends}
      />,
    );
    const section = screen.getByRole('region', { name: 'Исходящие заявки' });
    expect(within(section).getByRole('link', { name: /Нина/ })).toBeInTheDocument();

    await userEvent.click(
      within(section).getByRole('button', { name: 'Отменить заявку для Нина' }),
    );

    expect(within(section).queryByRole('link', { name: /Нина/ })).not.toBeInTheDocument();
    expect(within(section).getByText('Исходящих заявок нет')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/friendships/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('shows scoped groups in the UI with fallback and hides restricted groups', async () => {
    render(<GroupsView groups={groups} />);
    const box = screen.getByRole('searchbox', { name: 'Поиск групп' });

    await userEvent.type(box, 'Киновечера');
    expect(screen.getByRole('link', { name: /Киновечера/ })).toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Документ');
    expect(screen.getByRole('link', { name: /Документальное кино/ })).toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Закрытый');
    expect(screen.queryByRole('link', { name: /Закрытый клуб/ })).not.toBeInTheDocument();
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('renders the whole group card as a link with tags and no statistics', () => {
    render(<GroupsView groups={groups} />);
    const card = screen.getAllByTestId('group-card')[0]!;
    expect(within(card).getByRole('link', { name: /Киновечера/ })).toHaveAttribute(
      'href',
      '/groups/1',
    );
    expect(within(card).getByText('пятница')).toBeInTheDocument();
    expect(within(card).queryByText('Фильмов')).not.toBeInTheDocument();
    expect(within(card).queryByText('Средняя оценка')).not.toBeInTheDocument();
  });
});
