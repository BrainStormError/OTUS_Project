import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prefetchMock } = vi.hoisted(() => ({ prefetchMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ prefetch: prefetchMock }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    prefetch,
    children,
    ...rest
  }: {
    href: unknown;
    prefetch?: boolean;
    children?: React.ReactNode;
  } & Record<string, unknown>) => (
    <a
      href={typeof href === 'string' ? href : '#'}
      data-prefetch={prefetch === true ? 'true' : prefetch === false ? 'false' : 'auto'}
      onClick={(event) => event.preventDefault()}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import { FriendListItem } from '@/components/features/movie-tracker/FriendListItem';
import { GroupCard } from '@/components/features/movie-tracker/GroupCard';
import { MovieCard } from '@/components/features/movie-tracker/MovieCard';
import { WatchlistTable } from '@/components/features/movie-tracker/WatchlistTable';
import { NavLinks } from '@/components/layout/nav-links';
import { TopBar } from '@/components/layout/top-bar';

describe('shell link prefetching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prefetchMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('leaves every shell link on the framework default prefetch intent', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      // No explicit prop means the framework's viewport prefetch: one request
      // per destination per freshness window, not the Full strategy.
      expect(link).toHaveAttribute('data-prefetch', 'auto');
    }
  });

  it('issues no manual prefetch of its own on render, hover, focus, or activation', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);

    for (const link of screen.getAllByRole('link')) {
      fireEvent.pointerEnter(link);
      fireEvent.focus(link);
      fireEvent.click(link);
    }

    expect(prefetchMock).not.toHaveBeenCalled();
  });

  it('issues no manual prefetch during browser idle time', async () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    await vi.runAllTimersAsync();
    expect(prefetchMock).not.toHaveBeenCalled();
  });

  it('does not prefetch catalog card destinations', () => {
    render(
      <MovieCard
        movie={{
          tmdbId: 1,
          kind: 'film',
          title: 'Тест',
          year: 2020,
          rating: 7,
          genres: [],
          posterUrl: null,
        }}
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-prefetch', 'false');
    expect(prefetchMock).not.toHaveBeenCalled();
  });
});

const movie = {
  tmdbId: 27205,
  kind: 'film' as const,
  title: 'Начало',
  year: 2010,
  rating: 8.4,
  genres: [],
  posterUrl: null,
};

describe('chrome and list links never prefetch', () => {
  it('marks the top-bar brand and account-menu links as non-prefetching and stays quiet on hover', () => {
    render(<TopBar name="Алексей" tag="me" />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) {
      expect(link).toHaveAttribute('data-prefetch', 'false');
      fireEvent.pointerEnter(link);
      fireEvent.focus(link);
    }
    expect(prefetchMock).not.toHaveBeenCalled();
  });

  it('issues no prefetch when a list of friends, groups, and watch-later rows is rendered or hovered', () => {
    render(
      <>
        <ul>
          <FriendListItem user={{ id: 1, name: 'Иван', handle: 'ivan' }} />
        </ul>
        <GroupCard
          group={{
            id: 3,
            name: 'Клуб',
            tags: [],
            members: [],
            stats: { count: 0, genres: [], years: [] },
          }}
        />
        <WatchlistTable
          testId="watchlist"
          items={[{ id: 7, movie, addedAt: '2024-01-01' }]}
          onRate={() => undefined}
          onRemove={() => undefined}
        />
      </>,
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) {
      expect(link).toHaveAttribute('data-prefetch', 'false');
      fireEvent.pointerEnter(link);
      fireEvent.focus(link);
    }
    expect(prefetchMock).not.toHaveBeenCalled();
  });
});
