import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type IdentityDisplay = 'name' | 'tag' | 'both';

export const THEME_KEY = 'theme';
export const IDENTITY_DISPLAY_KEY = 'identity-display';
export const RAIL_COLLAPSED_KEY = 'rail-collapsed';

export const PREFERENCES_EVENT = 'movie-tracker:preferences';

export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_IDENTITY_DISPLAY: IdentityDisplay = 'name';
export const DEFAULT_RAIL_COLLAPSED = false;

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
