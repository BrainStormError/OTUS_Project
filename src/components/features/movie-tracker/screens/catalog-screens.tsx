'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import type { CatalogDetail } from '@/modules/catalog';
import type { RatingEntry } from '@/modules/ratings';
import type { WatchlistEntry } from '@/modules/watchlist';

import { toWatchedRecord, toWatchlistItem } from '../adapters';
import { toMovie } from '../catalog-view';
import { FilmDetail } from '../FilmDetail';
import { MyFilmsView } from '../MyFilmsView';
import { MySeriesView } from '../MySeriesView';
import { RecordView } from '../RecordView';
import type { MediaKind } from '../types';
import { useApi, useApiAll } from './use-api';

type RecordsRead = { items: RatingEntry[] };
type WatchlistRead = { items: WatchlistEntry[] };
type DetailRead = { item: CatalogDetail };

export function CatalogListScreen({ kind }: { kind: MediaKind }) {
  const state = useApiAll<[RecordsRead, WatchlistRead]>([
    '/api/records',
    `/api/watchlist?kind=${kind}`,
  ]);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return <ErrorState message="Не удалось загрузить список." />;
  }

  const records = state.data[0].items.map(toWatchedRecord);
  const items = state.data[1].items.map(toWatchlistItem);

  return kind === 'film' ? (
    <MyFilmsView initialRecords={records} initialWatchlist={items} />
  ) : (
    <MySeriesView initialRecords={records} initialWatchlist={items} />
  );
}

export function RecordScreen({ id }: { id: string }) {
  const state = useApi<RecordsRead>('/api/records');

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return <ErrorState message="Не удалось загрузить запись." />;
  }

  const entry = state.data.items.find(
    (item) => String(item.id) === id && item.mediaKind === 'film',
  );

  return <RecordView record={entry ? toWatchedRecord(entry) : null} />;
}

export function CatalogDetailScreen({
  kind,
  tmdbId,
}: {
  kind: MediaKind;
  tmdbId: string;
}) {
  const state = useApiAll<[DetailRead, RecordsRead, WatchlistRead]>([
    `/api/catalog/detail?kind=${kind}&id=${encodeURIComponent(tmdbId)}`,
    '/api/records',
    `/api/watchlist?kind=${kind}`,
  ]);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return state.code === 404 ? (
      <EmptyState title="Не найдено" description="Такого фильма или сериала нет в каталоге." />
    ) : (
      <ErrorState message="Не удалось загрузить страницу." />
    );
  }

  const [detail, records, watchlist] = state.data;
  const entry = records.items.find(
    (item) => item.mediaKind === kind && item.mediaRef === tmdbId,
  );
  const planned = watchlist.items.find((item) => item.mediaRef === tmdbId);

  return (
    <FilmDetail
      movie={toMovie(detail.item)}
      initialRecord={entry ? toWatchedRecord(entry) : null}
      initialWatchlistId={planned?.id ?? null}
    />
  );
}
