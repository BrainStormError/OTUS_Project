'use client';

import { Suspense, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { CatalogSearchResult } from '@/modules/catalog';

import { mediaKey, toMovie } from './catalog-view';
import { PopularFallback, PopularStream } from './HomeStreams';
import { MovieCard } from './MovieCard';
import type { RatingPayload } from './RatingForm';
import { useWatchedRecords } from './record-store';
import { RecordModal } from './RecordModal';
import { SearchField } from './SearchField';
import { SocialFeed } from './SocialFeed';
import type {
  FilterOption,
  MediaKind,
  Movie,
  SearchFilters,
  WatchedRecord,
  WatchlistItem,
} from './types';
import { useWatchlist } from './watchlist-store';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; items: CatalogSearchResult[]; page: number; hasMore: boolean };

export function HomeView({
  popularFilms = [],
  genres = [],
  initialRecords = [],
  initialWatchlist = [],
  popularFilmsPromise,
}: {
  popularFilms?: CatalogSearchResult[];
  genres?: FilterOption[];
  initialRecords?: WatchedRecord[];
  initialWatchlist?: WatchlistItem[];
  popularFilmsPromise?: Promise<CatalogSearchResult[]>;
}) {
  const { records, upsert } = useWatchedRecords(initialRecords);
  const watchedIds = useMemo(() => new Set(records.map((record) => mediaKey(record.movie))), [records]);
  const {
    items: watchlistItems,
    add: addToWatchlist,
    remove: removeFromWatchlist,
    drop: dropFromWatchlist,
  } = useWatchlist(initialWatchlist);
  const plannedIds = useMemo(
    () => new Set(watchlistItems.map((item) => mediaKey(item.movie))),
    [watchlistItems],
  );

  const [kind, setKind] = useState<MediaKind>('film');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [submitted, setSubmitted] = useState<SearchFilters>({});

  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const activeRecord = activeMovie
    ? records.find((record) => mediaKey(record.movie) === mediaKey(activeMovie)) ?? null
    : null;

  function changeKind(next: MediaKind) {
    setKind(next);
    setFilters({});
    setSubmitted({});
    setSearch({ status: 'idle' });
  }

  async function loadPage(active: SearchFilters, page: number) {
    const append = page > 1;
    setSearch((previous) =>
      append && previous.status === 'done' ? previous : { status: 'loading' },
    );
    try {
      const params = new URLSearchParams({ kind, page: String(page) });
      if (active.title) params.set('q', active.title);
      if (active.genre?.length) params.set('genre', active.genre.join(','));
      if (active.yearFrom) params.set('yearFrom', active.yearFrom);
      if (active.yearTo) params.set('yearTo', active.yearTo);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        setSearch({ status: 'error' });
        return;
      }
      const data = (await response.json()) as {
        items?: CatalogSearchResult[];
        page?: number;
        hasMore?: boolean;
      };
      const items = data.items ?? [];
      setSearch((previous) => ({
        status: 'done',
        items: append && previous.status === 'done' ? [...previous.items, ...items] : items,
        page: data.page ?? page,
        hasMore: Boolean(data.hasMore),
      }));
    } catch {
      setSearch({ status: 'error' });
    }
  }

  function runSearch(active: SearchFilters) {
    setSubmitted(active);
    void loadPage(active, 1);
  }

  function saveRecord(movie: Movie, payload: RatingPayload) {
    const existing = records.find((record) => mediaKey(record.movie) === mediaKey(movie));
    upsert({
      id: existing?.id ?? movie.tmdbId,
      movie,
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    });
    dropFromWatchlist(movie);
    setActiveMovie(null);
  }

  function togglePlanned(movie: Movie, next: boolean) {
    if (next) {
      addToWatchlist(movie);
      return;
    }
    const item = watchlistItems.find((entry) => mediaKey(entry.movie) === mediaKey(movie));
    if (item) {
      removeFromWatchlist(item);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
        <p className="text-sm text-muted-foreground">
          Найдите фильм или сериал, отметьте просмотр и следите за друзьями.
        </p>
      </header>

      <SearchField
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={runSearch}
        onReset={() => setSearch({ status: 'idle' })}
        genres={genres}
        kind={kind}
        onKindChange={changeKind}
      />

      {search.status === 'idle' ? (
        <>
          <section className="space-y-3" aria-label="Лента активности">
            <h2 className="text-lg font-medium">Лента активности</h2>
            <SocialFeed />
          </section>

          <section className="space-y-3" aria-label="Популярные фильмы">
            <h2 className="text-lg font-medium">Популярное</h2>
            {popularFilmsPromise ? (
              <Suspense fallback={<PopularFallback />}>
                <PopularStream
                  films={popularFilmsPromise}
                  watchedIds={watchedIds}
                  plannedIds={plannedIds}
                  onToggleWatched={setActiveMovie}
                  onTogglePlanned={togglePlanned}
                />
              </Suspense>
            ) : popularFilms.length === 0 ? (
              <EmptyState
                title="Популярное недоступно"
                description="Не удалось загрузить подборку из TMDB."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {popularFilms.slice(0, 8).map((item) => {
                  const movie = toMovie(item);
                  return (
                    <MovieCard
                      key={mediaKey(movie)}
                      movie={movie}
                      watched={watchedIds.has(mediaKey(movie))}
                      planned={plannedIds.has(mediaKey(movie))}
                      onToggleWatched={() => setActiveMovie(movie)}
                      onTogglePlanned={(next) => togglePlanned(movie, next)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="space-y-4" aria-label="Результаты поиска">
          {search.status === 'loading' ? (
            <p role="status" className="text-sm text-muted-foreground">
              Идёт поиск…
            </p>
          ) : search.status === 'error' ? (
            <EmptyState
              title="Не удалось выполнить поиск"
              description="Попробуйте ещё раз позже."
            />
          ) : (
            <>
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                Найдено: {search.items.length}
              </p>
              {search.items.length === 0 ? (
                <EmptyState
                  title="Ничего не найдено"
                  description="Попробуйте изменить запрос или сбросить фильтры."
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {search.items.map((item) => {
                      const movie = toMovie(item);
                      return (
                        <MovieCard
                          key={mediaKey(movie)}
                          movie={movie}
                          watched={watchedIds.has(mediaKey(movie))}
                          planned={plannedIds.has(mediaKey(movie))}
                          onToggleWatched={() => setActiveMovie(movie)}
                          onTogglePlanned={(next) => togglePlanned(movie, next)}
                        />
                      );
                    })}
                  </div>
                  {search.hasMore ? (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void loadPage(submitted, search.page + 1)}
                      >
                        Показать ещё
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>
      )}

      <RecordModal
        movie={activeMovie}
        record={activeRecord}
        onClose={() => setActiveMovie(null)}
        onSubmit={saveRecord}
      />
    </div>
  );
}
