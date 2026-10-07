'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

import { MovieCard } from './MovieCard';
import { movieMatches } from './data';
import { RecordModal } from './RecordModal';
import type { RatingPayload } from './RatingForm';
import { useWatchedRecords } from './record-store';
import { SearchField } from './SearchField';
import { seriesToMovie } from './series';
import type { FeedEvent } from './feed';
import { SocialFeed } from './SocialFeed';
import type { Movie, SearchFilters, Series, WatchedRecord } from './types';

type MediaResult =
  | { kind: 'film'; key: string; movie: Movie }
  | { kind: 'series'; key: string; series: Series };

function SeriesResultCard({ series }: { series: Series }) {
  return (
    <article
      data-testid="series-card"
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm transition-hover hover:shadow-md"
    >
      <Link
        href="/series"
        className="flex flex-col gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="text-sm font-semibold leading-tight">{series.title}</span>
        <span className="text-xs text-muted-foreground">{series.year}</span>
        <ul className="flex flex-wrap gap-1" aria-label="Жанры">
          {series.genres.map((genre) => (
            <li key={genre}>
              <Badge>{genre}</Badge>
            </li>
          ))}
        </ul>
      </Link>
    </article>
  );
}

export function HomeView({
  movies,
  series = [],
  initialFeed = [],
  initialRecords = [],
}: {
  movies: Movie[];
  series?: Series[];
  initialFeed?: FeedEvent[];
  initialRecords?: WatchedRecord[];
}) {
  const { records, upsert } = useWatchedRecords(initialRecords);
  const watchedIds = useMemo(
    () => new Set(records.map((record) => record.movie.tmdbId)),
    [records],
  );

  const [filters, setFilters] = useState<SearchFilters>({});
  const [committed, setCommitted] = useState<SearchFilters | null>(null);
  const options = useMemo(() => [...movies, ...series.map(seriesToMovie)], [movies, series]);

  const results = useMemo<MediaResult[]>(() => {
    if (!committed) {
      return [];
    }
    const filmResults = movies
      .filter((movie) => movieMatches(movie, '', committed))
      .map((movie) => ({ kind: 'film' as const, key: `film-${movie.tmdbId}`, movie }));
    const seriesResults = series
      .filter((item) => movieMatches(seriesToMovie(item), '', committed))
      .map((item) => ({ kind: 'series' as const, key: `series-${item.id}`, series: item }));
    return [...filmResults, ...seriesResults];
  }, [committed, movies, series]);

  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const activeRecord = activeMovie
    ? records.find((record) => record.movie.tmdbId === activeMovie.tmdbId) ?? null
    : null;

  function saveRecord(movie: Movie, payload: RatingPayload) {
    const existing = records.find((record) => record.movie.tmdbId === movie.tmdbId);
    upsert({
      id: existing?.id ?? movie.tmdbId,
      movie,
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    });
    setActiveMovie(null);
  }

  function renderCard(movie: Movie) {
    return (
      <MovieCard
        key={movie.tmdbId}
        movie={movie}
        watched={watchedIds.has(movie.tmdbId)}
        onToggleWatched={() => setActiveMovie(movie)}
      />
    );
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
        movies={options}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={(next) => setCommitted(next)}
        onReset={() => setCommitted(null)}
      />

      {committed ? (
        <section className="space-y-4" aria-label="Результаты поиска">
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            Найдено: {results.length}
          </p>
          {results.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить запрос или сбросить фильтры."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((result) =>
                result.kind === 'film' ? (
                  <MovieCard
                    key={result.key}
                    movie={result.movie}
                    watched={watchedIds.has(result.movie.tmdbId)}
                    onToggleWatched={() => setActiveMovie(result.movie)}
                  />
                ) : (
                  <SeriesResultCard key={result.key} series={result.series} />
                ),
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="space-y-3" aria-label="Лента активности">
            <h2 className="text-lg font-medium">Лента активности</h2>
            <SocialFeed initialEvents={initialFeed} />
          </section>

          <section className="space-y-3" aria-label="Популярные фильмы">
            <h2 className="text-lg font-medium">Популярное</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {movies.slice(0, 4).map(renderCard)}
            </div>
          </section>
        </>
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
