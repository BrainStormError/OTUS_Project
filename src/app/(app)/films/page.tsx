import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { FilmsData, ListSectionSkeleton } from '@/components/features/movie-tracker/ListSections';
import { getActor } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

export default async function FilmsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Мои фильмы</h1>
        <p className="text-sm text-muted-foreground">Просмотренные фильмы и оценки.</p>
      </header>
      <Suspense fallback={<ListSectionSkeleton />}>
        <FilmsData actor={actor} />
      </Suspense>
    </div>
  );
}
