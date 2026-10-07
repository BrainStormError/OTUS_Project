import { notFound } from 'next/navigation';

import { toWatchedRecord } from '@/components/features/movie-tracker/adapters';
import { FilmDetail } from '@/components/features/movie-tracker/FilmDetail';
import { findMovie } from '@/components/features/movie-tracker/data';
import { getActor } from '@/modules/auth/session';
import { listWatchedRecords } from '@/modules/records';

export const dynamic = 'force-dynamic';

export default async function FilmPage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const { tmdbId } = await params;
  const movie = findMovie(Number(tmdbId));
  if (!movie) {
    notFound();
  }

  const actor = await getActor();
  const result = actor ? await listWatchedRecords(actor) : null;
  const entry = result?.ok
    ? result.value.find((item) => item.mediaKind === 'film' && item.mediaRef === tmdbId)
    : undefined;

  return <FilmDetail movie={movie} initialRecord={entry ? toWatchedRecord(entry) : null} />;
}
