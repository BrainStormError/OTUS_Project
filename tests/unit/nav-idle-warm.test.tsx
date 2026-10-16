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
    children,
    ...rest
  }: { href: unknown; children?: React.ReactNode } & Record<string, unknown>) => (
    <a
      href={typeof href === 'string' ? href : '#'}
      onClick={(event) => event.preventDefault()}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import { NavLinks } from '@/components/layout/nav-links';
import { sections } from '@/components/layout/sections';

describe('shell idle warm-up', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prefetchMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('warms the remaining shell destinations during idle and leaves activation to normal navigation', async () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    expect(prefetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('link', { name: /Настройки/ }));
    expect(prefetchMock).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(prefetchMock.mock.calls.map((call) => call[0])).toEqual(
      sections.map((section) => section.href),
    );
  });
});
