import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MovieCard } from '@/components/features/movie-tracker/MovieCard';
import { NavLinks } from '@/components/layout/nav-links';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
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

describe('shell link prefetching', () => {
  it('prefetches every navigation shell destination', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('data-prefetch', 'true');
    }
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
  });
});
