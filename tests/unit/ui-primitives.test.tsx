import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { FriendListItem } from '@/components/features/movie-tracker/FriendListItem';
import { FriendRequestItem } from '@/components/features/movie-tracker/FriendRequestItem';
import { GroupCard } from '@/components/features/movie-tracker/GroupCard';
import { MovieCard } from '@/components/features/movie-tracker/MovieCard';
import { PrivacyToggle } from '@/components/features/movie-tracker/PrivacyToggle';
import { RatingForm } from '@/components/features/movie-tracker/RatingForm';
import { StatCard } from '@/components/features/movie-tracker/StatCard';
import { groups } from '@/components/features/movie-tracker/data';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonGrid } from '@/components/ui/skeleton';

const movie = {
  tmdbId: 1,
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

  it('renders a skeleton grid matching the content shape', () => {
    const { container } = render(<SkeletonGrid count={4} />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(4);
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
    expect(screen.getByLabelText('Пригласить по handle')).toBeInTheDocument();

    rerender(<AdminMemberPanel group={groups[0]!} isAdmin={false} />);
    expect(screen.queryByTestId('admin-member-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('restricted-no-permission')).toBeInTheDocument();
  });

  it('invites a member by handle and removes a member', async () => {
    render(<AdminMemberPanel group={groups[0]!} isAdmin />);
    await userEvent.type(screen.getByLabelText('Пригласить по handle'), 'newbie');
    await userEvent.click(screen.getByRole('button', { name: /Пригласить/ }));
    expect(screen.getByText('@newbie')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Удалить Алексей/ }));
    expect(screen.queryByText('@me')).not.toBeInTheDocument();
  });
});
