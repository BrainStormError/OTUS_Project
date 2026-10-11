import { notFound } from 'next/navigation';

import { getActor } from '@/modules/auth/session';
import { resolveDetail, type CatalogMediaKind } from '@/modules/catalog';
import { listWatchedRecords } from '@/modules/records';
import { listWatchlist } from '@/modules/watchlist';

import { toWatchedRecord } from './adapters';
import { toMovie } from './catalog-view';
import { FilmDetail } from './FilmDetail';

export async function FilmDetailSection({
  kind,
  tmdbId,
}: {
  kind: CatalogMediaKind;
  tmdbId: string;
}) {
  const detail = await resolveDetail(kind, tmdbId);
  if (!detail.ok) {
    notFound();
  }

  const actor = await getActor();
  const result = actor ? await listWatchedRecords(actor) : null;
  const entry = result?.ok
    ? result.value.find((item) => item.mediaKind === kind && item.mediaRef === tmdbId)
    : undefined;

  const watchlist = actor ? await listWatchlist(actor, kind) : null;
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
