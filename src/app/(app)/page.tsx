import { HomeView } from '@/components/features/movie-tracker/HomeView';
import { listMovies } from '@/components/features/movie-tracker/data';
import { toFeedEvent, type FeedEvent } from '@/components/features/movie-tracker/feed';
import { listSeries } from '@/components/features/movie-tracker/series-data';
import { listFeed } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const actor = await getActor();
  let initialFeed: FeedEvent[] = [];
  if (actor) {
    const feed = await listFeed(actor, { limit: 20 });
    if (feed.ok) {
      initialFeed = feed.value.items.map((item) => toFeedEvent(item, actor.id));
    }
  }

  return <HomeView movies={listMovies()} series={listSeries()} initialFeed={initialFeed} />;
}
