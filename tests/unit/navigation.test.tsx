import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountMenu } from '@/components/layout/account-menu';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { NavLinks } from '@/components/layout/nav-links';
import { SidebarRail } from '@/components/layout/sidebar-rail';
import { TopBar } from '@/components/layout/top-bar';
import { IDENTITY_DISPLAY_KEY } from '@/components/layout/preferences';
import { isSectionActive, sections, tabSections } from '@/components/layout/sections';

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/films',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
}));

beforeEach(() => {
  window.localStorage.clear();
  signOutMock.mockReset();
});

describe('section list', () => {
  it('exposes the seven primary sections with My Series below My Films', () => {
    expect(sections.map((section) => section.label)).toEqual([
      'Главная',
      'Мои фильмы',
      'Мои сериалы',
      'Друзья',
      'Группы',
      'Профиль',
      'Настройки',
    ]);
    const filmsIndex = sections.findIndex((section) => section.key === 'films');
    expect(sections[filmsIndex + 1]?.key).toBe('series');
  });

  it('keeps Settings out of the six-tab mobile bar', () => {
    expect(tabSections).toHaveLength(6);
    expect(tabSections.map((section) => section.key)).toContain('series');
    expect(tabSections.map((section) => section.key)).not.toContain('settings');
  });

  it('marks the active section consistently', () => {
    expect(isSectionActive('/', '/')).toBe(true);
    expect(isSectionActive('/', '/films')).toBe(false);
    expect(isSectionActive('/films', '/films/abc')).toBe(true);
    expect(isSectionActive('/series', '/series/abc')).toBe(true);
    expect(isSectionActive('/friends', '/films')).toBe(false);
  });
});

describe('navigation shell', () => {
  it('marks the current section in the desktop rail', () => {
    render(<NavLinks variant="rail" ariaLabel="Основная навигация" />);
    expect(screen.getByRole('link', { name: /Мои фильмы/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Главная/ })).not.toHaveAttribute('aria-current');
  });

  it('renders all seven sections in the desktop rail', () => {
    render(<SidebarRail />);
    for (const label of [
      'Главная',
      'Мои фильмы',
      'Мои сериалы',
      'Друзья',
      'Группы',
      'Профиль',
      'Настройки',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('collapses the rail, hides labels, and persists the collapsed state', async () => {
    const { unmount } = render(<SidebarRail />);
    expect(screen.getByText('Мои фильмы')).toBeInTheDocument();
    expect(screen.queryByText('Смотровик')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Свернуть меню' }));
    expect(screen.queryByText('Мои фильмы')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Развернуть меню' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(window.localStorage.getItem('rail-collapsed')).toBe('1');

    unmount();
    render(<SidebarRail />);
    expect(screen.queryByText('Мои фильмы')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Развернуть меню' }));
    expect(screen.getByText('Мои фильмы')).toBeInTheDocument();
    expect(window.localStorage.getItem('rail-collapsed')).toBe('0');
  });

  it('renders the centered brand link to Home in the top bar', () => {
    render(<TopBar name="Алексей" tag="me" />);
    const brand = screen.getByRole('link', { name: /Смотровик/ });
    expect(brand).toHaveAttribute('href', '/');
    expect(brand.className).toContain('text-lg');
  });

  it('renders six reachable tabs with the current one marked on mobile', () => {
    render(<MobileTabBar />);
    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.getByRole('link', { name: /Мои фильмы/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('provides no global search field and no theme switch in the top bar', () => {
    const { container } = render(<TopBar name="Алексей" tag="me" />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(container.querySelector('form[role="search"]')).toBeNull();
    expect(screen.queryByRole('button', { name: /тему/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument();
  });
});

describe('account menu', () => {
  it('shows the name, tag, or both per the identity preference and never the email', () => {
    const first = render(<AccountMenu name="Алексей" tag="me" />);
    expect(first.getByText('Алексей')).toBeInTheDocument();
    expect(first.queryByText('@me')).not.toBeInTheDocument();
    first.unmount();

    window.localStorage.setItem(IDENTITY_DISPLAY_KEY, 'tag');
    const second = render(<AccountMenu name="Алексей" tag="me" />);
    expect(second.queryByText('Алексей')).not.toBeInTheDocument();
    expect(second.getByText('@me')).toBeInTheDocument();
    second.unmount();

    window.localStorage.setItem(IDENTITY_DISPLAY_KEY, 'both');
    render(<AccountMenu name="Алексей" tag="me" />);
    expect(screen.getByText('Алексей')).toBeInTheDocument();
    expect(screen.getByText('@me')).toBeInTheDocument();
  });

  it('offers Profile, Settings, and sign-out that calls the auth action', async () => {
    render(<AccountMenu name="Алексей" tag="me" />);
    const menu = screen.getByText('Профиль').closest('details')!;
    expect(within(menu).getByRole('link', { name: 'Профиль' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Настройки' })).toBeInTheDocument();

    await userEvent.click(within(menu).getByRole('button', { name: 'Выйти' }));
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
