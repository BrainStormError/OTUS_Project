'use client';

import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import type { CatalogSearchResult } from '@/modules/catalog';

import { deriveCatalogOptions, mediaKey, toMovie, type CatalogOptions } from './catalog-view';
import type { FeedEvent } from './feed';
import { MovieCard } from './MovieCard';
import type { RatingPayload } from './RatingForm';
import { useWatchedRecords } from './record-store';
import { RecordModal } from './RecordModal';
import { SearchField } from './SearchField';
import { SocialFeed } from './SocialFeed';
import type { MediaKind, Movie, SearchFilters, WatchedRecord } from './types';

type Options = CatalogOptions;
const EMPTY_OPTIONS: Options = { genres: [], years: [] };

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; items: CatalogSearchResult[] };

export function HomeView({
  popularFilms = [],
  initialFeed = [],
  initialRecords = [],
}: {
  popularFilms?: CatalogSearchResult[];
  initialFeed?: FeedEvent[];
  initialRecords?: WatchedRecord[];
}) {
  const { records, upsert } = useWatchedRecords(initialRecords);
  const watchedIds = useMemo(() => new Set(records.map((record) => mediaKey(record.movie))), [records]);

  const [kind, setKind] = useState<MediaKind>('film');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [optionsByKind, setOptionsByKind] = useState<Record<MediaKind, Options>>(() => ({
    film: deriveCatalogOptions(popularFilms),
    series: EMPTY_OPTIONS,
  }));

  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const activeRecord = activeMovie
    ? records.find((record) => mediaKey(record.movie) === mediaKey(activeMovie)) ?? null
    : null;

  function changeKind(next: MediaKind) {
    setKind(next);
    setFilters({});
    setSearch({ status: 'idle' });
    const current = optionsByKind[next];
    if (current.genres.length === 0 && current.years.length === 0) {
      void fetch(`/api/search?kind=${next}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { items?: CatalogSearchResult[] } | null) => {
          if (data?.items) {
            setOptionsByKind((previous) => ({ ...previous, [next]: deriveCatalogOptions(data.items as CatalogSearchResult[]) }));
          }
        })
        .catch(() => undefined);
    }
  }

  async function runSearch(active: SearchFilters) {
    setSearch({ status: 'loading' });
    try {
      const params = new URLSearchParams({ kind });
      if (active.title) params.set('q', active.title);
      if (active.genre?.length) params.set('genre', active.genre.join(','));
      if (active.year) params.set('year', active.year);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        setSearch({ status: 'error' });
        return;
      }
      const data = (await response.json()) as { items?: CatalogSearchResult[] };
      setSearch({ status: 'done', items: data.items ?? [] });
    } catch {
      setSearch({ status: 'error' });
    }
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
    setActiveMovie(null);
  }

  const activeOptions = optionsByKind[kind];

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
        genres={activeOptions.genres}
        years={activeOptions.years}
        kind={kind}
        onKindChange={changeKind}
      />

      {search.status === 'idle' ? (
        <>
          <section className="space-y-3" aria-label="Лента активности">
            <h2 className="text-lg font-medium">Лента активности</h2>
            <SocialFeed initialEvents={initialFeed} />
          </section>

          <section className="space-y-3" aria-label="Популярные фильмы">
            <h2 className="text-lg font-medium">Популярное</h2>
            {popularFilms.length === 0 ? (
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
                      onToggleWatched={() => setActiveMovie(movie)}
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {search.items.map((item) => {
                    const movie = toMovie(item);
                    return (
                      <MovieCard
                        key={mediaKey(movie)}
                        movie={movie}
                        watched={watchedIds.has(mediaKey(movie))}
                        onToggleWatched={() => setActiveMovie(movie)}
                      />
                    );
                  })}
                </div>
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
