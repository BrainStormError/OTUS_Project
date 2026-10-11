'use client';

import { use } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { CatalogSearchResult } from '@/modules/catalog';

import { mediaKey, toMovie } from './catalog-view';
import type { FeedEvent } from './feed';
import { MovieCard } from './MovieCard';
import { SocialFeed } from './SocialFeed';
import type { Movie } from './types';

export function FeedStream({ events }: { events: Promise<FeedEvent[]> }) {
  const items = use(events);
  return <SocialFeed initialEvents={items} />;
}

export function PopularStream({
  films,
  watchedIds,
  plannedIds,
  onToggleWatched,
  onTogglePlanned,
}: {
  films: Promise<CatalogSearchResult[]>;
  watchedIds: Set<string>;
  plannedIds: Set<string>;
  onToggleWatched: (movie: Movie) => void;
  onTogglePlanned: (movie: Movie, next: boolean) => void;
}) {
  const items = use(films);
  if (items.length === 0) {
    return (
      <EmptyState
        title="Популярное недоступно"
        description="Не удалось загрузить подборку из TMDB."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.slice(0, 8).map((item) => {
        const movie = toMovie(item);
        return (
          <MovieCard
            key={mediaKey(movie)}
            movie={movie}
            watched={watchedIds.has(mediaKey(movie))}
            planned={plannedIds.has(mediaKey(movie))}
            onToggleWatched={() => onToggleWatched(movie)}
            onTogglePlanned={(next) => onTogglePlanned(movie, next)}
          />
        );
      })}
    </div>
  );
}

export function FeedFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Загрузка ленты"
      data-testid="feed-skeleton"
      className="space-y-3"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border p-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function PopularFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Загрузка популярного"
      data-testid="popular-skeleton"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
