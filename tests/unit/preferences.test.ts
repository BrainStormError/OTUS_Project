import { beforeEach, describe, expect, it } from 'vitest';

import {
  IDENTITY_DISPLAY_KEY,
  RAIL_COLLAPSED_KEY,
  THEME_KEY,
  readIdentityDisplay,
  readRailCollapsed,
  readTheme,
  writeIdentityDisplay,
  writeRailCollapsed,
  writeTheme,
} from '@/components/layout/preferences';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('preferences defaults', () => {
  it('returns SSR-safe defaults when nothing is stored', () => {
    expect(readTheme()).toBe('light');
    expect(readIdentityDisplay()).toBe('name');
    expect(readRailCollapsed()).toBe(false);
  });

  it('falls back for invalid stored values', () => {
    window.localStorage.setItem(THEME_KEY, 'neon');
    window.localStorage.setItem(IDENTITY_DISPLAY_KEY, 'email');
    window.localStorage.setItem(RAIL_COLLAPSED_KEY, 'yes');
    expect(readTheme()).toBe('light');
    expect(readIdentityDisplay()).toBe('name');
    expect(readRailCollapsed()).toBe(false);
  });
});

describe('preferences round-trips', () => {
  it('persists the theme and applies the data-theme attribute', () => {
    writeTheme('dark');
    expect(readTheme()).toBe('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists the identity display preference', () => {
    writeIdentityDisplay('tag');
    expect(readIdentityDisplay()).toBe('tag');
    expect(window.localStorage.getItem(IDENTITY_DISPLAY_KEY)).toBe('tag');

    writeIdentityDisplay('both');
    expect(readIdentityDisplay()).toBe('both');
  });

  it('persists the rail collapsed preference', () => {
    writeRailCollapsed(true);
    expect(readRailCollapsed()).toBe(true);
    expect(window.localStorage.getItem(RAIL_COLLAPSED_KEY)).toBe('1');

    writeRailCollapsed(false);
    expect(readRailCollapsed()).toBe(false);
    expect(window.localStorage.getItem(RAIL_COLLAPSED_KEY)).toBe('0');
  });
});
