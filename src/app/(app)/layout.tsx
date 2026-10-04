import { redirect } from 'next/navigation';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
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
    <div className="flex min-h-screen flex-col">
      <Header actor={actor} />
      <main className="container flex-1 py-8">{children}</main>
      <Footer />
    </div>
  );
}
