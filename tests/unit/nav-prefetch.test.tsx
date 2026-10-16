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
      {...rest}
    >
      {children}
    </a>
  ),
}));

import { MovieCard } from '@/components/features/movie-tracker/MovieCard';
import { NavLinks } from '@/components/layout/nav-links';

describe('shell link prefetching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prefetchMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not prefetch any shell destination just by rendering the shell', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    expect(prefetchMock).not.toHaveBeenCalled();
  });

  it('prefetches the destination of a hovered shell link', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    fireEvent.pointerEnter(screen.getByRole('link', { name: /Мои фильмы/ }));
    expect(prefetchMock).toHaveBeenCalledWith('/films');
  });

  it('prefetches the destination of a focused shell link', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    fireEvent.focus(screen.getByRole('link', { name: /Друзья/ }));
    expect(prefetchMock).toHaveBeenCalledWith('/friends');
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
