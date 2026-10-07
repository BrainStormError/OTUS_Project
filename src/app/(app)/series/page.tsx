import { redirect } from 'next/navigation';

import { toSeriesRecord } from '@/components/features/movie-tracker/adapters';
import { MySeriesView } from '@/components/features/movie-tracker/MySeriesView';
import { getActor } from '@/modules/auth/session';
import { listWatchedRecords } from '@/modules/records';

export const dynamic = 'force-dynamic';

export default async function SeriesPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const result = await listWatchedRecords(actor);
  const records = result.ok
    ? result.value.filter((entry) => entry.mediaKind === 'series').map(toSeriesRecord)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Мои сериалы</h1>
        <p className="text-sm text-muted-foreground">Просмотренные сериалы и оценки.</p>
      </header>
      <MySeriesView initialRecords={records} />
    </div>
  );
}
