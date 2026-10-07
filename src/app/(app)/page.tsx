import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { toWatchedRecord } from '@/components/features/movie-tracker/adapters';
import { listMovies } from '@/components/features/movie-tracker/data';
import { toFeedEvent, type FeedEvent } from '@/components/features/movie-tracker/feed';
import { listSeries } from '@/components/features/movie-tracker/series-data';
import type { WatchedRecord } from '@/components/features/movie-tracker/types';
import { listFeed } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';
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

  return (
    <HomeView
      movies={listMovies()}
      series={listSeries()}
      initialFeed={initialFeed}
      initialRecords={initialRecords}
    />
  );
}
