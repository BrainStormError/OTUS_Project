'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ListStoreProvider } from '@/components/features/movie-tracker/list-store';
import { useRead } from '@/components/features/movie-tracker/read-store';

import { Footer } from './footer';
import { MobileTabBar } from './mobile-tab-bar';
import { loadSession } from './session-loader';
import { ShellIdentityContext, type ShellIdentity } from './shell-identity';
import { SidebarRail } from './sidebar-rail';
import { TopBar } from './top-bar';

// The shell is part of the static document: it renders no identity until the
// session's loaded reads answer. A refusal sends the viewer to the login
// screen; the server still decides every subsequent data request.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const identityState = useRead<ShellIdentity>('/api/me/identity');

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (
      identityState.status === 'error' &&
      (identityState.code === 401 || identityState.code === 403)
    ) {
      router.replace('/login');
    }
  }, [identityState, router]);

  const identity =
    identityState.status === 'ready' && typeof identityState.data.id === 'number'
      ? identityState.data
      : null;

  return (
    <ShellIdentityContext.Provider value={identity}>
      <ListStoreProvider actorId={identity?.id ?? 0}>
        <div className="flex min-h-screen">
          <SidebarRail />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar name={identity?.name ?? null} tag={identity?.handle ?? null} />
            <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
            <Footer />
            <MobileTabBar />
          </div>
        </div>
      </ListStoreProvider>
    </ShellIdentityContext.Provider>
  );
}
