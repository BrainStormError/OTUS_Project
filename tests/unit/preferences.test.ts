import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HOUR_CYCLE_KEY,
  IDENTITY_DISPLAY_KEY,
  RAIL_COLLAPSED_KEY,
  THEME_KEY,
  currentDateInTimeZone,
  readHour12,
  readIdentityDisplay,
  readRailCollapsed,
  readTheme,
  resolveTimeZone,
  useTimeFormat,
  writeHour12,
  writeIdentityDisplay,
  writeRailCollapsed,
  writeTheme,
} from '@/components/layout/preferences';

function stubTimeZone(timeZone: string): void {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.restoreAllMocks();
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

describe('currentDateInTimeZone', () => {
  it('formats the instant as YYYY-MM-DD in the browser time zone', () => {
    stubTimeZone('UTC');
    expect(currentDateInTimeZone(new Date('2026-05-20T10:30:00.000Z'))).toBe('2026-05-20');
  });

  it('uses the local day when the browser zone differs from UTC', () => {
    const lateUtc = new Date('2026-01-01T00:30:00.000Z');
    stubTimeZone('UTC');
    expect(currentDateInTimeZone(lateUtc)).toBe('2026-01-01');

    vi.restoreAllMocks();
    stubTimeZone('America/New_York');
    expect(currentDateInTimeZone(lateUtc)).toBe('2025-12-31');
  });

  it('falls back to UTC when the browser zone cannot be resolved', () => {
    stubTimeZone('Not/AZone');
    expect(resolveTimeZone()).toBe('UTC');
    expect(currentDateInTimeZone(new Date('2026-05-20T10:30:00.000Z'))).toBe('2026-05-20');
  });

  it('ignores a timezone value stored by an earlier version', () => {
    stubTimeZone('UTC');
    window.localStorage.setItem('timezone', 'Europe/Moscow');
    expect(currentDateInTimeZone(new Date('2026-01-01T00:30:00.000Z'))).toBe('2026-01-01');
  });
});

describe('time format preferences', () => {
  it('defaults to a 24-hour clock', () => {
    expect(readHour12()).toBe(false);
  });

  it('round-trips the hour cycle', () => {
    writeHour12(true);
    expect(readHour12()).toBe(true);
    expect(window.localStorage.getItem(HOUR_CYCLE_KEY)).toBe('12');

    writeHour12(false);
    expect(readHour12()).toBe(false);
    expect(window.localStorage.getItem(HOUR_CYCLE_KEY)).toBe('24');
  });

  it('syncs the hook through the preferences event', () => {
    const { result } = renderHook(() => useTimeFormat());
    expect(result.current.hour12).toBe(false);

    act(() => {
      writeHour12(true);
    });

    expect(result.current.hour12).toBe(true);

    act(() => {
      result.current.setHourCycle(false);
    });
    expect(result.current.hour12).toBe(false);
    expect(window.localStorage.getItem(HOUR_CYCLE_KEY)).toBe('24');
  });
});
