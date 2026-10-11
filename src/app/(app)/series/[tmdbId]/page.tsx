import Link from 'next/link';
import { Suspense } from 'react';

import { DetailSkeleton } from '@/components/features/movie-tracker/DetailSkeleton';
import { FilmDetailSection } from '@/components/features/movie-tracker/FilmDetailSection';

export const dynamic = 'force-dynamic';

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const { tmdbId } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/series"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Назад к поиску
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <FilmDetailSection kind="series" tmdbId={tmdbId} />
      </Suspense>
    </div>
  );
}
