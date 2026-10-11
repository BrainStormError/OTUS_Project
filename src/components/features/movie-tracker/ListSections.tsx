import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import type { Actor } from '@/core/auth/policy';
import { listCatalog, type CatalogMediaKind } from '@/modules/catalog';
import { listWatchlist } from '@/modules/watchlist';

import { toWatchedRecordFromRated, toWatchlistItem } from './adapters';
import { MyFilmsView } from './MyFilmsView';
import { MySeriesView } from './MySeriesView';

async function loadList(actor: Actor, kind: CatalogMediaKind) {
  const [result, watchlist] = await Promise.all([
    listCatalog(actor.id, kind),
    listWatchlist(actor, kind),
  ]);
  return {
    records: result.ok ? result.value.map(toWatchedRecordFromRated) : [],
    items: watchlist.ok ? watchlist.value.map(toWatchlistItem) : [],
  };
}

export async function FilmsData({ actor }: { actor: Actor }) {
  const { records, items } = await loadList(actor, 'film');
  return <MyFilmsView initialRecords={records} initialWatchlist={items} />;
}

export async function SeriesData({ actor }: { actor: Actor }) {
  const { records, items } = await loadList(actor, 'series');
  return <MySeriesView initialRecords={records} initialWatchlist={items} />;
}

export function ListSectionSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Загрузка"
      data-testid="list-skeleton"
      className="space-y-3"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border p-3">
          <Skeleton className="h-4 w-1/3" />
          <SkeletonText lines={1} />
        </div>
      ))}
    </div>
  );
}
