import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  HOUR_CYCLE_KEY,
  IDENTITY_DISPLAY_KEY,
  RAIL_COLLAPSED_KEY,
  THEME_KEY,
  TIMEZONE_KEY,
  currentDateInTimeZone,
  readHour12,
  readIdentityDisplay,
  readRailCollapsed,
  readTheme,
  readTimezone,
  useTimeFormat,
  writeHour12,
  writeIdentityDisplay,
  writeRailCollapsed,
  writeTheme,
  writeTimezone,
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

describe('currentDateInTimeZone', () => {
  it('formats the instant as YYYY-MM-DD in the given time zone', () => {
    const instant = new Date('2026-05-20T10:30:00.000Z');
    expect(currentDateInTimeZone('UTC', instant)).toBe('2026-05-20');
  });

  it('uses the local day when the zone differs from UTC', () => {
    const lateUtc = new Date('2026-01-01T00:30:00.000Z');
    expect(currentDateInTimeZone('UTC', lateUtc)).toBe('2026-01-01');
    expect(currentDateInTimeZone('America/New_York', lateUtc)).toBe('2025-12-31');

    const earlyUtc = new Date('2025-12-31T20:30:00.000Z');
    expect(currentDateInTimeZone('UTC', earlyUtc)).toBe('2025-12-31');
    expect(currentDateInTimeZone('Asia/Tokyo', earlyUtc)).toBe('2026-01-01');
  });

  it('falls back to the browser time zone for an unavailable zone', () => {
    const instant = new Date('2026-05-20T10:30:00.000Z');
    expect(currentDateInTimeZone('Not/AZone', instant)).toBe(
      currentDateInTimeZone(undefined, instant),
    );
  });
});

describe('time format preferences', () => {
  it('defaults to the browser timezone and a 24-hour clock', () => {
    expect(readTimezone()).toBe('');
    expect(readHour12()).toBe(false);
  });

  it('round-trips the timezone and the hour cycle', () => {
    writeTimezone('Europe/Moscow');
    writeHour12(true);
    expect(readTimezone()).toBe('Europe/Moscow');
    expect(readHour12()).toBe(true);
    expect(window.localStorage.getItem(TIMEZONE_KEY)).toBe('Europe/Moscow');
    expect(window.localStorage.getItem(HOUR_CYCLE_KEY)).toBe('12');
  });

  it('syncs the hook through the preferences event', () => {
    const { result } = renderHook(() => useTimeFormat());
    expect(result.current.timeZone).toBe('');
    expect(result.current.hour12).toBe(false);

    act(() => {
      writeTimezone('America/New_York');
      writeHour12(true);
    });

    expect(result.current.timeZone).toBe('America/New_York');
    expect(result.current.hour12).toBe(true);

    act(() => {
      result.current.setHourCycle(false);
    });
    expect(result.current.hour12).toBe(false);
    expect(window.localStorage.getItem(HOUR_CYCLE_KEY)).toBe('24');
  });
});
