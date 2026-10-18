import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { Banners } from '@/components/layout/banners';
import { ThemeSelect } from '@/components/features/movie-tracker/ThemeSelect';
import { THEME_KEY, readTheme, writeTheme } from '@/components/layout/preferences';
import { CACHE_CLEAR_DIRECTIVE } from '@/proxy';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

describe('ThemeSelect (Settings only)', () => {
  it('changes the theme through the data-theme attribute without editing components', async () => {
    render(<ThemeSelect />);
    const dark = await screen.findByRole('radio', { name: 'Тёмная' });

    await userEvent.click(dark);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(screen.getByRole('radio', { name: 'Светлая' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });
});

describe('Banners', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<Banners banners={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces each banner with its message', () => {
    render(<Banners banners={[{ id: '1', tone: 'warning', message: 'Осторожно' }]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Осторожно');
  });
});

describe('theme preference survives a deployment cache clear', () => {
  it('clears only the HTTP cache and leaves the stored theme untouched', () => {
    writeTheme('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');

    // The build marker asks the browser to drop the HTTP cache only. A
    // `storage` directive would wipe the theme, so it must never appear.
    expect(CACHE_CLEAR_DIRECTIVE).toBe('"cache"');
    expect(CACHE_CLEAR_DIRECTIVE).not.toContain('storage');

    // The theme the app restores comes from localStorage, which a cache-only
    // clear does not touch: it is still the user's choice afterwards.
    expect(readTheme()).toBe('dark');
  });
});
