import type { CatalogSearchResult } from '@/modules/catalog';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { toWatchedRecord, toWatchlistItem } from '@/components/features/movie-tracker/adapters';
import { toFeedEvent, type FeedEvent } from '@/components/features/movie-tracker/feed';
import type {
  WatchedRecord,
  WatchlistItem,
} from '@/components/features/movie-tracker/types';
import { listFeed } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';
import { searchCatalog } from '@/modules/catalog';
import { listWatchedRecords } from '@/modules/records';
import { listWatchlist } from '@/modules/watchlist';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const actor = await getActor();

  // Slow sections are started but not awaited: their promises stream into the
  // client view under Suspense so the shell and SearchField paint first.
  const initialFeedPromise: Promise<FeedEvent[]> = actor
    ? listFeed(actor, { limit: 20 })
        .then((feed) =>
          feed.ok ? feed.value.items.map((item) => toFeedEvent(item, actor.id)) : [],
        )
        .catch(() => [])
    : Promise.resolve([]);

  const popularFilmsPromise: Promise<CatalogSearchResult[]> = searchCatalog({ kind: 'film' })
    .then((popular) => (popular.ok ? popular.value.items : []))
    .catch(() => []);

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
      initialRecords={initialRecords}
      initialWatchlist={initialWatchlist}
      popularFilmsPromise={popularFilmsPromise}
      initialFeedPromise={initialFeedPromise}
    />
  );
}
