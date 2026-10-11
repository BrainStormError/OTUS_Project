import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RouteLoadingSkeleton } from '@/components/features/RouteLoadingSkeleton';

describe('RouteLoadingSkeleton', () => {
  it('renders placeholders and is exposed as a busy status', () => {
    const { container } = render(<RouteLoadingSkeleton />);

    const status = screen.getByRole('status', { name: 'Загрузка' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('exposes no readable text, only decorative placeholders', () => {
    const { container } = render(<RouteLoadingSkeleton />);

    expect(container.textContent).toBe('');
    const placeholders = container.querySelectorAll('[aria-hidden="true"]');
    expect(placeholders.length).toBeGreaterThan(0);
    placeholders.forEach((element) => {
      expect(element).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
