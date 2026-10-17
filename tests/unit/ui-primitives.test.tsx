import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { currentDateInTimeZone } from '@/components/layout/preferences';
import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { FriendListItem } from '@/components/features/movie-tracker/FriendListItem';
import { FriendRequestItem } from '@/components/features/movie-tracker/FriendRequestItem';
import { GroupCard } from '@/components/features/movie-tracker/GroupCard';
import { MovieCard } from '@/components/features/movie-tracker/MovieCard';
import { PrivacyToggle } from '@/components/features/movie-tracker/PrivacyToggle';
import { RatingForm } from '@/components/features/movie-tracker/RatingForm';
import { StatCard } from '@/components/features/movie-tracker/StatCard';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import type { Group } from '@/components/features/movie-tracker/types';
import type { GroupInvitation } from '@/modules/groups';

afterEach(() => {
  vi.unstubAllGlobals();
});

const groups: Group[] = [
  {
    id: 1,
    name: 'Киновечера',
    description: 'Смотрим и обсуждаем по пятницам.',
    tags: ['пятница'],
    members: [{ id: 1, name: 'Алексей', handle: 'me', role: 'admin' }],
    stats: { count: 0, genres: [], years: [] },
  },
];

const movie = {
  tmdbId: 1,
  kind: 'film' as const,
  title: 'Тестовый фильм',
  year: 2020,
  rating: 7.3,
  genres: ['драма'],
  posterUrl: null,
};

describe('shared state primitives', () => {
  it('renders empty state with an actionable call to action', () => {
    render(<EmptyState title="Пусто" description="Пояснение" action={<button>Действие</button>} />);
    expect(screen.getByText('Пусто')).toBeInTheDocument();
    expect(screen.getByText('Пояснение')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действие' })).toBeInTheDocument();
  });

  it('offers retry on error', async () => {
    const retry = vi.fn();
    render(<ErrorState message="Сбой" retry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe('MovieCard', () => {
  it('shows poster fallback, title, year, rating, genres, and watched action', async () => {
    const onToggle = vi.fn();
    render(<MovieCard movie={movie} onToggleWatched={onToggle} />);
    expect(screen.getByTestId('poster-fallback')).toBeInTheDocument();
    expect(screen.getByText('Тестовый фильм')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('7.3')).toBeInTheDocument();
    expect(screen.getByText('драма')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Отметить просмотренным/ }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('renders a poster image when available', () => {
    render(<MovieCard movie={{ ...movie, posterUrl: 'data:image/svg+xml,x' }} />);
    expect(screen.queryByTestId('poster-fallback')).not.toBeInTheDocument();
  });

  it('loads the poster lazily and reserves its 2/3 space', () => {
    render(<MovieCard movie={{ ...movie, posterUrl: 'https://example.com/poster.jpg' }} />);
    const poster = screen.getByAltText('Постер «Тестовый фильм»');
    expect(poster).toHaveAttribute('loading', 'lazy');
    expect(poster).toHaveAttribute('decoding', 'async');
    expect(poster).toHaveAttribute('width', '300');
    expect(poster).toHaveAttribute('height', '450');
  });

  it('shows a watched indicator only when watched', () => {
    const { rerender } = render(<MovieCard movie={movie} />);
    expect(screen.queryByTestId('watched-badge')).not.toBeInTheDocument();

    rerender(<MovieCard movie={movie} watched />);
    const badge = screen.getByTestId('watched-badge');
    expect(badge).toHaveAttribute('title', 'Просмотрено');
    expect(badge).toHaveAttribute('aria-label', 'Просмотрено');
    expect(badge.tagName).toBe('SPAN');
  });
});

describe('RatingForm', () => {
  it('accepts a decimal rating in range', async () => {
    const onSubmit = vi.fn();
    render(<RatingForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Оценка (0–10)' }), '8.5');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(onSubmit).toHaveBeenCalledWith({ rating: 8.5, comment: undefined, watchedAt: '' });
  });

  it('rejects an out-of-range rating with an associated message', async () => {
    const onSubmit = vi.fn();
    render(<RatingForm onSubmit={onSubmit} />);
    const input = screen.getByRole('spinbutton', { name: 'Оценка (0–10)' });
    await userEvent.type(input, '11');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('от 0 до 10');
    expect(input).toHaveAttribute('aria-describedby', error.id);
  });

  it('caps the watch date control at the current day', () => {
    render(<RatingForm />);
    expect(screen.getByLabelText('Дата просмотра')).toHaveAttribute(
      'max',
      currentDateInTimeZone(),
    );
  });

  it('rejects a future watch date without saving', async () => {
    const onSubmit = vi.fn();
    render(<RatingForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Оценка (0–10)' }), '8');
    fireEvent.change(screen.getByLabelText('Дата просмотра'), {
      target: { value: '2999-01-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('не может быть в будущем');
  });

  it('accepts the current day and earlier watch dates', async () => {
    const onSubmit = vi.fn();
    render(<RatingForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Оценка (0–10)' }), '8');
    const date = screen.getByLabelText('Дата просмотра');

    fireEvent.change(date, { target: { value: currentDateInTimeZone() } });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ rating: 8, watchedAt: currentDateInTimeZone() }),
    );

    fireEvent.change(date, { target: { value: '2000-01-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ watchedAt: '2000-01-01' }),
    );
  });

  it('omits the add-to-personal checkbox unless the caller wires it', () => {
    render(<RatingForm />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders a controlled add-to-personal checkbox with the given label', async () => {
    const onAlsoPersonalChange = vi.fn();
    render(
      <RatingForm
        alsoPersonal={false}
        onAlsoPersonalChange={onAlsoPersonalChange}
        alsoPersonalLabel="также добавить в мои сериалы"
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'также добавить в мои сериалы' });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(onAlsoPersonalChange).toHaveBeenCalledWith(true);
  });
});

describe('statistics and privacy primitives', () => {
  it('renders a statistic card', () => {
    render(<StatCard label="Фильмов" value={12} hint="за год" />);
    expect(screen.getByTestId('stat-card')).toHaveTextContent('Фильмов');
    expect(screen.getByTestId('stat-card')).toHaveTextContent('12');
  });

  it('renders the privacy toggle as a switch and updates aria-checked', async () => {
    const onChange = vi.fn();
    render(<PrivacyToggle label="Скрыть профиль" checked={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'Скрыть профиль' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('friend, group, and admin primitives', () => {
  it('renders a friend list item linking to the profile with an action', () => {
    render(<FriendListItem user={{ id: 1, name: 'Мария', handle: 'maria' }} action={<button>Действие</button>} />);
    expect(screen.getByRole('link', { name: /Мария/ })).toHaveAttribute('href', '/u/maria');
    expect(screen.getByRole('button', { name: 'Действие' })).toBeInTheDocument();
  });

  it('shows an avatar in the friend item and drops the placeholder icon', () => {
    const { container } = render(<FriendListItem user={{ id: 1, name: 'Мария', handle: 'maria' }} />);
    expect(container.querySelector('.lucide-user-round')).toBeNull();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('handles accept and decline on a friend request', async () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(<FriendRequestItem user={{ id: 7, name: 'Иван', handle: 'ivan' }} onAccept={onAccept} onDecline={onDecline} />);
    await userEvent.click(screen.getByRole('button', { name: /Принять заявку от Иван/ }));
    await userEvent.click(screen.getByRole('button', { name: /Отклонить заявку от Иван/ }));
    expect(onAccept).toHaveBeenCalledWith(7);
    expect(onDecline).toHaveBeenCalledWith(7);
  });

  it('renders a group card as a link with description and tags and no statistics', () => {
    render(<GroupCard group={groups[0]!} />);
    const card = screen.getByTestId('group-card');
    expect(card).toHaveTextContent('Киновечера');
    expect(card).toHaveTextContent('Смотрим и обсуждаем по пятницам.');
    expect(card).toHaveTextContent('пятница');
    expect(card).not.toHaveTextContent('Средняя оценка');
    expect(within(card).getByRole('link', { name: /Киновечера/ })).toHaveAttribute(
      'href',
      '/groups/1',
    );
  });

  it('shows admin controls only to admins', () => {
    const { rerender } = render(<AdminMemberPanel group={groups[0]!} isAdmin />);
    expect(screen.getByTestId('admin-member-panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Поиск людей для приглашения')).toBeInTheDocument();

    rerender(<AdminMemberPanel group={groups[0]!} isAdmin={false} />);
    expect(screen.queryByTestId('admin-member-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('restricted-no-permission')).toBeInTheDocument();
  });

  it('shows an avatar on each member and pending invitation entry', () => {
    const invitation: GroupInvitation = {
      id: 3,
      groupId: 1,
      groupName: 'Киновечера',
      inviterId: 1,
      inviterName: 'Алексей',
      inviterHandle: 'me',
      inviteeId: 5,
      inviteeName: 'Нина',
      inviteeHandle: 'nina',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    render(<AdminMemberPanel group={groups[0]!} isAdmin invitations={[invitation]} />);
    const panel = screen.getByTestId('admin-member-panel');
    expect(within(panel).getAllByTestId('avatar')).toHaveLength(2);
  });

  it('invites a searched user and removes a member', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost');
      if (url.pathname === '/api/friendships/search') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{ id: 9, name: 'Новичок', handle: 'newbie', relationship: 'none' }],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ id: 1 }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminMemberPanel group={groups[0]!} isAdmin />);
    await userEvent.type(screen.getByLabelText('Поиск людей для приглашения'), 'Новичок');
    await userEvent.click(await screen.findByRole('button', { name: 'Пригласить Новичок' }));

    const pending = await screen.findByRole('region', { name: 'Ожидающие приглашения' });
    expect(within(pending).getByText('@newbie')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Удалить Алексей/ }));
    expect(screen.queryByText('@me')).not.toBeInTheDocument();
  });
});
