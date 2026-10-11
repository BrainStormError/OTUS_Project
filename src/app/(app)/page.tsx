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
  let initialFeed: FeedEvent[] = [];
  let initialRecords: WatchedRecord[] = [];
  let initialWatchlist: WatchlistItem[] = [];
  if (actor) {
    const [feed, records, watchlist] = await Promise.all([
      listFeed(actor, { limit: 20 }),
      listWatchedRecords(actor),
      listWatchlist(actor, 'film'),
    ]);
    if (feed.ok) {
      initialFeed = feed.value.items.map((item) => toFeedEvent(item, actor.id));
    }
    if (records.ok) {
      initialRecords = records.value
        .filter((entry) => entry.mediaKind === 'film')
        .map(toWatchedRecord);
    }
    if (watchlist.ok) {
      initialWatchlist = watchlist.value.map(toWatchlistItem);
    }
  }

  const popular = await searchCatalog({ kind: 'film' });
  const popularFilms: CatalogSearchResult[] = popular.ok ? popular.value.items : [];

  return (
    <HomeView
      popularFilms={popularFilms}
      initialFeed={initialFeed}
      initialRecords={initialRecords}
      initialWatchlist={initialWatchlist}
    />
  );
}
