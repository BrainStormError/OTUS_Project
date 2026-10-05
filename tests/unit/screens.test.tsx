import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { FriendsView } from '@/components/features/movie-tracker/FriendsView';
import { GroupsView } from '@/components/features/movie-tracker/GroupsView';
import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { MyFilmsView } from '@/components/features/movie-tracker/MyFilmsView';
import { MySeriesView } from '@/components/features/movie-tracker/MySeriesView';
import { ProfileView } from '@/components/features/movie-tracker/ProfileView';
import { RecordView } from '@/components/features/movie-tracker/RecordView';
import { SettingsView } from '@/components/features/movie-tracker/SettingsView';
import { StatisticsView } from '@/components/features/movie-tracker/StatisticsView';
import {
  currentUser,
  currentUserStats,
  findUser,
  friendRequests,
  friends,
  groups,
  listMovies,
  searchFriends,
  searchGroups,
} from '@/components/features/movie-tracker/data';
import { RECORDS_STORAGE_KEY } from '@/components/features/movie-tracker/record-store';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

describe('My Films and records', () => {
  it('lists watched records as a table with title, rating, and date, and no permanent edit action', async () => {
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
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
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
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
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
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
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
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
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
    await userEvent.type(screen.getByLabelText('Название'), 'Матрица');
    expect(within(list).getByText('Матрица')).toBeInTheDocument();
    expect(within(list).queryByText('Начало')).not.toBeInTheDocument();
  });

  it('scopes genre, actor, director, and year options to watched films', async () => {
    render(<MyFilmsView />);
    await screen.findByTestId('my-films');

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
    render(<MyFilmsView />);
    await screen.findByTestId('my-films');
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
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');

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

  it('opens an individual record and shows an empty state for a missing one', async () => {
    const { rerender } = render(<RecordView id="w1" />);
    expect(await screen.findByRole('heading', { name: 'Начало' })).toBeInTheDocument();
    expect(screen.getByText(/Дата просмотра:/)).toBeInTheDocument();

    rerender(<RecordView id="missing" />);
    expect(await screen.findByText('Запись не найдена')).toBeInTheDocument();
  });

  it('reflects a saved rating immediately', async () => {
    window.localStorage.setItem(
      RECORDS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'w-680',
          movie: { tmdbId: 680, title: 'Криминальное чтиво', year: 1994, rating: 8.5, genres: ['драма'] },
          rating: 8.5,
          comment: 'Классика',
          watchedAt: '2026-09-01',
        },
      ]),
    );
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
    expect(within(list).getByText('Криминальное чтиво')).toBeInTheDocument();
    expect(within(list).getByText('2026-09-01')).toBeInTheDocument();
  });
});

describe('My Series', () => {
  it('lists series with title, rating, and date columns and sorts by header', async () => {
    render(<MySeriesView />);
    const list = await screen.findByTestId('my-series');
    expect(within(list).getByRole('columnheader', { name: /Название/ })).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toBeInTheDocument();
    expect(within(list).getByRole('columnheader', { name: /Дата просмотра/ })).toBeInTheDocument();

    const dataRows = () => within(list).getAllByRole('row').slice(1);
    expect(within(dataRows()[0]!).getByText('Во все тяжкие')).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: /Оценка/ }));
    expect(within(list).getByRole('columnheader', { name: /Оценка/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(within(dataRows()[0]!).getByText('Игра в кальмара')).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: /Название/ }));
    expect(within(list).getByRole('columnheader', { name: /Название/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('expands a whole-series row in place without seasons or episodes', async () => {
    render(<MySeriesView />);
    const list = await screen.findByTestId('my-series');
    const button = within(list).getByRole('button', { name: 'Чернобыль' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(within(list).getByText('Мощно.')).toBeVisible();
    expect(within(list).queryByText(/Сезон/)).not.toBeInTheDocument();
    expect(within(list).queryByText(/^Серия/)).not.toBeInTheDocument();
  });

  it('expands a single-season series directly to episodes', async () => {
    render(<MySeriesView />);
    const list = await screen.findByTestId('my-series');
    await userEvent.click(within(list).getByRole('button', { name: 'Игра в кальмара' }));
    expect(within(list).getByText('Серия 1.1 — Игра началась')).toBeVisible();
    expect(within(list).queryByText('Сезон 1')).not.toBeInTheDocument();
  });

  it('expands a multi-season series through seasons then episodes', async () => {
    render(<MySeriesView />);
    const list = await screen.findByTestId('my-series');
    await userEvent.click(within(list).getByRole('button', { name: 'Во все тяжкие' }));
    expect(within(list).getByText('Сезон 1')).toBeVisible();
    expect(within(list).getByText('Сезон 2')).toBeVisible();
    expect(within(list).queryByText(/^Серия 1\.1/)).not.toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: /Сезон 1/ }));
    expect(within(list).getByText('Серия 1.1 — Пилот')).toBeVisible();
  });

  it('requires a rating before adding a series', async () => {
    render(<MySeriesView />);
    await screen.findByTestId('my-series');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    const picker = screen.getByRole('dialog');
    await userEvent.click(within(picker).getByRole('button', { name: /Тьма/ }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/хотя бы одну оценку серии/);

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Целиком' }));
    await userEvent.type(within(dialog).getByLabelText('Оценка сериала (0–10)'), '8');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить' }));
    const list = screen.getByTestId('my-series');
    expect(await within(list).findByText('Тьма')).toBeInTheDocument();
  });

  it('clears previous ratings only after confirming a mode change', async () => {
    render(<MySeriesView />);
    const list = await screen.findByTestId('my-series');
    await userEvent.click(within(list).getByRole('button', { name: 'Во все тяжкие' }));
    await userEvent.click(within(list).getByRole('button', { name: 'Изменить' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Оценка серии 1.1')).toHaveValue(9);

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Целиком' }));
    const confirm = within(dialog).getByRole('alertdialog', { name: 'Смена режима' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Отмена' }));
    expect(within(dialog).getByLabelText('Оценка серии 1.1')).toHaveValue(9);

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Целиком' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сменить режим' }));
    expect(within(dialog).queryByLabelText('Оценка серии 1.1')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Оценка сериала (0–10)')).toHaveValue(null);
  });
});

describe('Home watched flow', () => {
  it('opens the rating form from a Home card and adds the film to My Films', async () => {
    const { unmount } = render(<HomeView movies={listMovies()} />);
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

    unmount();
    render(<MyFilmsView />);
    const list = await screen.findByTestId('my-films');
    expect(within(list).getByText('Тёмный рыцарь')).toBeInTheDocument();
  });

  it('shows a non-interactive watched indicator on watched cards', async () => {
    render(<HomeView movies={listMovies()} />);
    const badges = await screen.findAllByTestId('watched-badge');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveAttribute('title', 'Просмотрено');
    expect(badges[0]).toHaveAttribute('aria-label', 'Просмотрено');
    expect(badges[0]!.tagName).toBe('SPAN');
  });
});

describe('ProfileView', () => {
  it('shows the own profile with identity, statistics, and activity only', () => {
    render(<ProfileView user={currentUser} isOwn />);
    expect(screen.getByRole('heading', { name: 'Алексей' })).toBeInTheDocument();
    expect(screen.getByTestId('statistics')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Активность' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Приватность' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Настройки' })).not.toBeInTheDocument();
  });

  it('shows a relationship action on another users profile', () => {
    const maria = findUser('maria')!;
    render(<ProfileView user={maria} isOwn={false} />);
    expect(screen.getByRole('button', { name: 'Добавить в друзья' })).toBeInTheDocument();
  });

  it('shows the restricted state to a non-permitted viewer but not to the owner', () => {
    const secret = findUser('secret')!;
    render(<ProfileView user={secret} isOwn={false} />);
    expect(screen.getByTestId('restricted-profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить в друзья' })).toBeInTheDocument();
  });

  it('restricts statistics for a non-permitted viewer while the owner still sees values', () => {
    const ivan = findUser('ivan')!;
    const { rerender } = render(<ProfileView user={ivan} isOwn={false} />);
    expect(screen.getByTestId('restricted-statistics')).toBeInTheDocument();

    rerender(<ProfileView user={ivan} isOwn />);
    expect(screen.getByTestId('statistics')).toBeInTheDocument();
  });
});

describe('StatisticsView', () => {
  it('shows three statistics without an average rating card', () => {
    render(<StatisticsView stats={currentUserStats} />);
    const cards = screen.getAllByTestId('stat-card');
    expect(cards).toHaveLength(3);
    expect(screen.getByText('Всего фильмов')).toBeInTheDocument();
    expect(screen.queryByText('Средняя оценка')).not.toBeInTheDocument();
    expect(screen.getByText('Любимый жанр')).toBeInTheDocument();
    expect(screen.getByText('Любимый год')).toBeInTheDocument();
  });

  it('shows the restricted state instead of values', () => {
    render(<StatisticsView stats={currentUserStats} restricted />);
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
  it('reflects privacy toggles and theme selection', async () => {
    render(<SettingsView />);
    const profileToggle = screen.getByRole('switch', { name: 'Скрыть профиль' });
    expect(profileToggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(profileToggle);
    expect(profileToggle).toHaveAttribute('aria-checked', 'true');
    expect(await screen.findByText('Сохранено')).toBeInTheDocument();

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
  it('searches own friends first and falls back to non-hidden profiles', () => {
    expect(searchFriends('Мария', friends).map((user) => user.handle)).toEqual(['maria']);
    expect(searchFriends('Нина', friends).map((user) => user.handle)).toEqual(['nina']);
    expect(searchFriends('Скрытый', friends)).toEqual([]);
  });

  it('searches own groups first and falls back to non-restricted groups', () => {
    expect(searchGroups('Киновечера', groups).map((group) => group.id)).toEqual(['g1']);
    expect(searchGroups('Документ', groups).map((group) => group.id)).toEqual(['g3']);
    expect(searchGroups('Закрытый', groups)).toEqual([]);
  });

  it('matches groups by tag, falling back to non-restricted groups', () => {
    expect(searchGroups('ретро', groups).map((group) => group.id)).toEqual(['g2']);
    expect(searchGroups('биография', groups).map((group) => group.id)).toEqual(['g3']);
  });

  it('shows scoped friends in the UI and never leaks hidden profiles', async () => {
    render(<FriendsView initialRequests={friendRequests} initialFriends={friends} />);
    const searchRegion = screen.getByRole('region', { name: 'Поиск людей' });
    const box = within(searchRegion).getByRole('searchbox', { name: 'Поиск людей' });

    await userEvent.type(box, 'Мария');
    expect(within(searchRegion).getByRole('link', { name: /Мария/ })).toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Нина');
    expect(within(searchRegion).getByRole('link', { name: /Нина/ })).toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Скрытый');
    expect(within(searchRegion).queryByRole('link', { name: /Скрытый/ })).not.toBeInTheDocument();
    expect(within(searchRegion).getByText('Никого не найдено')).toBeInTheDocument();
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
      '/groups/g1',
    );
    expect(within(card).getByText('пятница')).toBeInTheDocument();
    expect(within(card).queryByText('Фильмов')).not.toBeInTheDocument();
    expect(within(card).queryByText('Средняя оценка')).not.toBeInTheDocument();
  });
});
