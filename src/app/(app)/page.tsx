import type { CatalogSearchResult } from '@/modules/catalog';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { toWatchedRecord, toWatchlistItem } from '@/components/features/movie-tracker/adapters';
import { genreOptionsFromCatalog } from '@/components/features/movie-tracker/catalog-view';
import type {
  WatchedRecord,
  WatchlistItem,
} from '@/components/features/movie-tracker/types';
import { getActor } from '@/modules/auth/session';
import { listGenres, searchCatalog } from '@/modules/catalog';
import { listWatchedRecords } from '@/modules/records';
import { listWatchlist } from '@/modules/watchlist';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const actor = await getActor();

  // Slow sections are started but not awaited: their promises stream into the
  // client view under Suspense so the shell and SearchField paint first.
  const popularFilmsPromise: Promise<CatalogSearchResult[]> = searchCatalog({ kind: 'film' })
    .then((popular) => (popular.ok ? popular.value.items : []))
    .catch(() => []);

  const genresResult = await listGenres();
  const genres = genresResult.ok ? genreOptionsFromCatalog(genresResult.value) : [];

  let initialRecords: WatchedRecord[] = [];
  let initialWatchlist: WatchlistItem[] = [];
  if (actor) {
    const [records, watchlist] = await Promise.all([
      listWatchedRecords(actor),
      listWatchlist(actor, 'film'),
    ]);
    if (records.ok) {
      initialRecords = records.value
        .filter((entry) => entry.mediaKind === 'film')
        .map(toWatchedRecord);
    }
    if (watchlist.ok) {
      initialWatchlist = watchlist.value.map(toWatchlistItem);
    }
  }

  return (
    <HomeView
      genres={genres}
      initialRecords={initialRecords}
      initialWatchlist={initialWatchlist}
      popularFilmsPromise={popularFilmsPromise}
    />
  );
}
