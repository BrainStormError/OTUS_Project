import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type IdentityDisplay = 'name' | 'tag' | 'both';

export const THEME_KEY = 'theme';
export const IDENTITY_DISPLAY_KEY = 'identity-display';
export const RAIL_COLLAPSED_KEY = 'rail-collapsed';
export const HOUR_CYCLE_KEY = 'hour-cycle';

export const PREFERENCES_EVENT = 'movie-tracker:preferences';

export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_IDENTITY_DISPLAY: IdentityDisplay = 'name';
export const DEFAULT_RAIL_COLLAPSED = false;
export const DEFAULT_HOUR12 = false;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readValue(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeValue(key: string, value: string): void {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // storage unavailable (private mode) — preference stays in memory for the session
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  }
}

function applyThemeAttribute(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function readTheme(): Theme {
  return readValue(THEME_KEY) === 'dark' ? 'dark' : DEFAULT_THEME;
}

export function writeTheme(theme: Theme): void {
  applyThemeAttribute(theme);
  writeValue(THEME_KEY, theme);
}

export function readIdentityDisplay(): IdentityDisplay {
  const value = readValue(IDENTITY_DISPLAY_KEY);
  return value === 'tag' || value === 'both' ? value : DEFAULT_IDENTITY_DISPLAY;
}

export function writeIdentityDisplay(value: IdentityDisplay): void {
  writeValue(IDENTITY_DISPLAY_KEY, value);
}

export function readRailCollapsed(): boolean {
  const value = readValue(RAIL_COLLAPSED_KEY);
  if (value === '1') {
    return true;
  }
  if (value === '0') {
    return false;
  }
  return DEFAULT_RAIL_COLLAPSED;
}

export function writeRailCollapsed(collapsed: boolean): void {
  writeValue(RAIL_COLLAPSED_KEY, collapsed ? '1' : '0');
}

export function readHour12(): boolean {
  return readValue(HOUR_CYCLE_KEY) === '12';
}

export function writeHour12(hour12: boolean): void {
  writeValue(HOUR_CYCLE_KEY, hour12 ? '12' : '24');
}

// Moments in time are always shown in the browser's timezone. A timezone value
// stored by an earlier version of the interface is ignored; when the browser
// zone cannot be resolved the timestamp falls back to UTC.
export function resolveTimeZone(): string {
  let zone: string;
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: zone });
    return zone;
  } catch {
    return 'UTC';
  }
}

export function currentDateInTimeZone(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatTimestamp(
  iso: string,
  { hour12 = DEFAULT_HOUR12 }: { hour12?: boolean } = {},
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: resolveTimeZone(),
    hour: hour12 ? 'numeric' : '2-digit',
    ...(hour12 ? { hour12: true } : { hourCycle: 'h23' }),
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  const dayPeriod = part('dayPeriod');
  const time = `${part('hour')}:${part('minute')}`;
  const day = `${part('day')}.${part('month')}.${part('year')}`;
  return `${time}${dayPeriod ? ` ${dayPeriod}` : ''} ${day}`;
}

export function useTimeFormat(): {
  hour12: boolean;
  setHourCycle: (hour12: boolean) => void;
} {
  const [value, setValue] = useState({ hour12: DEFAULT_HOUR12 });

  useEffect(() => {
    const sync = () => setValue({ hour12: readHour12() });
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(PREFERENCES_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(PREFERENCES_EVENT, sync);
    };
  }, []);

  const setHourCycle = useCallback((hour12: boolean) => {
    setValue({ hour12 });
    writeHour12(hour12);
  }, []);

  return { hour12: value.hour12, setHourCycle };
}

export function useIdentityDisplay(): [IdentityDisplay, (value: IdentityDisplay) => void] {
  const [value, setValue] = useState<IdentityDisplay>(DEFAULT_IDENTITY_DISPLAY);

  useEffect(() => {
    const sync = () => setValue(readIdentityDisplay());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(PREFERENCES_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(PREFERENCES_EVENT, sync);
    };
  }, []);

  const update = useCallback((next: IdentityDisplay) => {
    setValue(next);
    writeIdentityDisplay(next);
  }, []);

  return [value, update];
}

export function useRailCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsed] = useState(DEFAULT_RAIL_COLLAPSED);

  useEffect(() => {
    const sync = () => setCollapsed(readRailCollapsed());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(PREFERENCES_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(PREFERENCES_EVENT, sync);
    };
  }, []);

  const update = useCallback((next: boolean) => {
    setCollapsed(next);
    writeRailCollapsed(next);
  }, []);

  return [collapsed, update];
}
