import { cn } from '@/components/ui/utils';

import { MovieCard } from './MovieCard';
import type { Movie } from './types';

export function MovieGrid({
  movies,
  watchedIds = [],
  className,
}: {
  movies: Movie[];
  watchedIds?: number[];
  className?: string;
}) {
  return (
    <div
      data-testid="movie-grid"
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {movies.map((movie) => (
        <MovieCard key={movie.tmdbId} movie={movie} watched={watchedIds.includes(movie.tmdbId)} />
      ))}
    </div>
  );
}
