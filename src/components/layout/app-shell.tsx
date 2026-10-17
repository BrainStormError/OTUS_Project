'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ListStoreProvider } from '@/components/features/movie-tracker/list-store';

import { Footer } from './footer';
import { MobileTabBar } from './mobile-tab-bar';
import { ShellIdentityContext, type ShellIdentity } from './shell-identity';
import { SidebarRail } from './sidebar-rail';
import { TopBar } from './top-bar';

// The shell is part of the static document: it renders no identity until the
// authorized read answers. A refusal sends the viewer to the login screen; the
// server still decides every subsequent data request.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [identity, setIdentity] = useState<ShellIdentity | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/me/identity', {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          router.replace('/login');
          return null;
        }
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as ShellIdentity;
      })
      .then((data) => {
        if (data && typeof data.id === 'number') {
          setIdentity(data);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [router]);

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
