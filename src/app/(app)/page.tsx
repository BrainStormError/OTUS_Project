import type { CatalogSearchResult } from '@/modules/catalog';

import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { toWatchedRecord } from '@/components/features/movie-tracker/adapters';
import { toFeedEvent, type FeedEvent } from '@/components/features/movie-tracker/feed';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';
import { listFeed } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';
import { searchCatalog } from '@/modules/catalog';
import { listWatchedRecords } from '@/modules/records';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const actor = await getActor();
  let initialFeed: FeedEvent[] = [];
  let initialRecords: WatchedRecord[] = [];
  if (actor) {
    const [feed, records] = await Promise.all([
      listFeed(actor, { limit: 20 }),
      listWatchedRecords(actor),
    ]);
    if (feed.ok) {
      initialFeed = feed.value.items.map((item) => toFeedEvent(item, actor.id));
    }
    if (records.ok) {
      initialRecords = records.value
        .filter((entry) => entry.mediaKind === 'film')
        .map(toWatchedRecord);
    }
  }

  const popular = await searchCatalog({ kind: 'film' });
  const popularFilms: CatalogSearchResult[] = popular.ok ? popular.value : [];

  return (
    <HomeView popularFilms={popularFilms} initialFeed={initialFeed} initialRecords={initialRecords} />
  );
}
