import { notFound } from 'next/navigation';

import { toWatchedRecord } from '@/components/features/movie-tracker/adapters';
import { toMovie } from '@/components/features/movie-tracker/catalog-view';
import { FilmDetail } from '@/components/features/movie-tracker/FilmDetail';
import { getActor } from '@/modules/auth/session';
import { resolveDetail } from '@/modules/catalog';
import { listWatchedRecords } from '@/modules/records';
import { listWatchlist } from '@/modules/watchlist';

export const dynamic = 'force-dynamic';

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const { tmdbId } = await params;
  const detail = await resolveDetail('series', tmdbId);
  if (!detail.ok) {
    notFound();
  }

  const actor = await getActor();
  const result = actor ? await listWatchedRecords(actor) : null;
  const entry = result?.ok
    ? result.value.find((item) => item.mediaKind === 'series' && item.mediaRef === tmdbId)
    : undefined;

  const watchlist = actor ? await listWatchlist(actor, 'series') : null;
  const planned = watchlist?.ok
    ? watchlist.value.find((item) => item.mediaRef === tmdbId)
    : undefined;

  return (
    <FilmDetail
      movie={toMovie(detail.value)}
      initialRecord={entry ? toWatchedRecord(entry) : null}
      initialWatchlistId={planned?.id ?? null}
    />
  );
}
