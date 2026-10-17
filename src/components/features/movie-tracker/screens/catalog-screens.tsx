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
import { useRead, useReadAll } from '../read-store';
import type { MediaKind } from '../types';

type RecordsRead = { items: RatingEntry[] };
type WatchlistRead = { items: WatchlistEntry[] };
type DetailRead = { item: CatalogDetail };

export function CatalogListScreen({ kind }: { kind: MediaKind }) {
  const state = useReadAll<[RecordsRead, WatchlistRead]>([
    '/api/records',
    `/api/watchlist?kind=${kind}`,
  ]);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить список." retry={state.retry} />
    );
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
  const state = useRead<RecordsRead>('/api/records');

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить запись." retry={state.retry} />
    );
  }

  const entry = state.data.items.find(
    (item) => String(item.id) === id && item.mediaKind === 'film',
  );

  return <RecordView record={entry ? toWatchedRecord(entry) : null} />;
}

// The title page mixes a catalog read with the stored personal reads. Both come
// from the session store, so revisiting a title renders without another fetch.
export function CatalogDetailScreen({
  kind,
  tmdbId,
}: {
  kind: MediaKind;
  tmdbId: string;
}) {
  const detail = useRead<DetailRead>(
    `/api/catalog/detail?kind=${kind}&id=${encodeURIComponent(tmdbId)}`,
  );
  const personal = useReadAll<[RecordsRead, WatchlistRead]>([
    '/api/records',
    `/api/watchlist?kind=${kind}`,
  ]);

  if (detail.status === 'error' && detail.code === 404) {
    return (
      <EmptyState title="Не найдено" description="Такого фильма или сериала нет в каталоге." />
    );
  }
  if (detail.status === 'loading' || personal.status === 'loading') {
    return null;
  }
  if (detail.status === 'error' || personal.status === 'error') {
    return (
      <ErrorState
        message="Не удалось загрузить страницу."
        retry={
          personal.status === 'error'
            ? personal.retry
            : detail.status === 'error'
              ? detail.retry
              : undefined
        }
      />
    );
  }

  const entry = personal.data[0].items.find(
    (item) => item.mediaKind === kind && item.mediaRef === tmdbId,
  );
  const planned = personal.data[1].items.find((item) => item.mediaRef === tmdbId);

  return (
    <FilmDetail
      movie={toMovie(detail.data.item)}
      initialRecord={entry ? toWatchedRecord(entry) : null}
      initialWatchlistId={planned?.id ?? null}
    />
  );
}
