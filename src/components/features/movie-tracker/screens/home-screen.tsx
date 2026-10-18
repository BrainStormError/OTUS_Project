'use client';

import { ErrorState } from '@/components/ui/error-state';
import type { CatalogSearchResult, Genre } from '@/modules/catalog';
import type { RatingEntry } from '@/modules/ratings';
import type { WatchlistEntry } from '@/modules/watchlist';

import { toWatchedRecord, toWatchlistItem } from '../adapters';
import { genreOptionsFromCatalog } from '../catalog-view';
import { HomeView } from '../HomeView';
import { useRead, useReadAll } from '../read-store';

type GenresRead = { items: Genre[] };
type RecordsRead = { items: RatingEntry[] };
type WatchlistRead = { items: WatchlistEntry[] };
type SearchRead = { items: CatalogSearchResult[] };

export function HomeScreen() {
  const core = useReadAll<
    [GenresRead, GenresRead, RecordsRead, WatchlistRead, WatchlistRead]
  >([
    '/api/genres?kind=film',
    '/api/genres?kind=series',
    '/api/records',
    '/api/watchlist?kind=film',
    '/api/watchlist?kind=series',
  ]);
  // The popular shelf depends on a remote source; its failure must not take the
  // whole screen down. It renders its own empty state when unavailable.
  const popular = useRead<SearchRead>('/api/search?kind=film');

  if (core.status === 'loading') {
    return null;
  }
  if (core.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить главную страницу." retry={core.retry} />
    );
  }

  const [filmGenres, seriesGenres, records, filmWatchlist, seriesWatchlist] = core.data;

  return (
    <HomeView
      genresByKind={{
        film: genreOptionsFromCatalog(filmGenres.items),
        series: genreOptionsFromCatalog(seriesGenres.items),
      }}
      initialRecords={records.items.map(toWatchedRecord)}
      initialWatchlist={[...filmWatchlist.items, ...seriesWatchlist.items].map(
        toWatchlistItem,
      )}
      popularFilms={popular.status === 'ready' ? popular.data.items : []}
    />
  );
}
