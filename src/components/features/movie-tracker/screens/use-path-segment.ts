'use client';

import { useSyncExternalStore } from 'react';

import { usePathname } from 'next/navigation';

const subscribe = () => () => undefined;

// The shell document is prerendered without knowing the URL parameters, so the
// id is read from the browser path only after hydration. The server and first
// client render both take the null branch, so both stay identical.
export function usePathSegment(indexFromEnd: number): string | null {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!hydrated) {
    return null;
  }

  const parts = (pathname ?? '').split('/').filter(Boolean);
  const value = parts[parts.length - indexFromEnd];
  if (!value) {
    return null;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
