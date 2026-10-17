'use client';

import { createContext, useContext } from 'react';

export type ShellIdentity = { id: number; name: string; handle: string };

export const ShellIdentityContext = createContext<ShellIdentity | null>(null);

export function useShellIdentity(): ShellIdentity | null {
  return useContext(ShellIdentityContext);
}
