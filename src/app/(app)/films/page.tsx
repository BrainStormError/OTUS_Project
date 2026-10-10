import { redirect } from 'next/navigation';

import { toWatchedRecordFromRated } from '@/components/features/movie-tracker/adapters';
import { MyFilmsView } from '@/components/features/movie-tracker/MyFilmsView';
import { getActor } from '@/modules/auth/session';
import { listCatalog } from '@/modules/catalog';

export const dynamic = 'force-dynamic';

export default async function FilmsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const result = await listCatalog(actor.id, 'film');
  const records = result.ok ? result.value.map(toWatchedRecordFromRated) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Мои фильмы</h1>
        <p className="text-sm text-muted-foreground">Просмотренные фильмы и оценки.</p>
      </header>
      <MyFilmsView initialRecords={records} />
    </div>
  );
}
