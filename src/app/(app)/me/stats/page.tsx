import Link from 'next/link';
import { redirect } from 'next/navigation';

import { StatisticsView } from '@/components/features/movie-tracker/StatisticsView';
import { Button } from '@/components/ui/button';
import { getActor } from '@/modules/auth/session';
import { getOwnProfile } from '@/modules/profiles';

export const dynamic = 'force-dynamic';

export default async function MyStatsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const result = await getOwnProfile(actor);
  if (!result.ok) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Статистика</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/me">К профилю</Link>
        </Button>
      </header>
      <StatisticsView stats={result.value.stats} />
    </div>
  );
}
