import { redirect } from 'next/navigation';

import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { SidebarRail } from '@/components/layout/sidebar-rail';
import { TopBar } from '@/components/layout/top-bar';
import { currentUser } from '@/components/features/movie-tracker/data';
import { getActor } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <SidebarRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar name={currentUser.name} tag={currentUser.handle} />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
        <Footer />
        <MobileTabBar />
      </div>
    </div>
  );
}
