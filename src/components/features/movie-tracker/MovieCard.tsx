'use client';

import Link from 'next/link';
import { Bookmark, Check, Film, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

import type { MediaKind, Movie } from './types';

export function MovieCard({
  movie,
  kind,
  watched = false,
  planned = false,
  onToggleWatched,
  onTogglePlanned,
  href,
  className,
}: {
  movie: Movie;
  kind?: MediaKind;
  watched?: boolean;
  planned?: boolean;
  onToggleWatched?: (next: boolean) => void;
  onTogglePlanned?: (next: boolean) => void;
  href?: string;
  className?: string;
}) {
  const poster = movie.posterUrl ?? null;
  const mediaKind = kind ?? movie.kind;
  const detailHref = href ?? `/${mediaKind === 'series' ? 'series' : 'film'}/${movie.tmdbId}`;

  return (
    <article
      data-testid="movie-card"
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-card elevation-card transition-hover hover:elevation-raised',
        className,
      )}
    >
      <Link
        href={detailHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {poster ? (
            <img
              src={poster}
              alt={`Постер «${movie.title}»`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              data-testid="poster-fallback"
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              <Film aria-hidden="true" className="h-8 w-8" />
              <span className="text-xs">Нет постера</span>
            </div>
          )}
          {watched ? (
            <span
              data-testid="watched-badge"
              role="img"
              aria-label="Просмотрено"
              title="Просмотрено"
              className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
            </span>
          ) : null}
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground">
            <Star aria-hidden="true" className="h-3 w-3 text-accent-foreground" />
            {movie.rating.toFixed(1)}
          </span>
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{movie.title}</h3>
          {movie.year !== null ? (
            <p className="text-xs text-muted-foreground">{movie.year}</p>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-3 px-3 pb-3">
        <ul className="flex flex-wrap gap-1" aria-label="Жанры">
          {movie.genres.map((genre) => (
            <li key={genre}>
              <Badge>{genre}</Badge>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={watched ? 'secondary' : 'default'}
            aria-pressed={watched}
            onClick={() => onToggleWatched?.(!watched)}
            className="h-auto min-w-0 flex-1 whitespace-normal py-2 text-center"
          >
            {watched ? (
              <>
                <Check aria-hidden="true" className="mr-1 h-4 w-4" />
                Просмотрено
              </>
            ) : (
              'Отметить просмотренным'
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={planned ? 'secondary' : 'outline'}
            aria-pressed={planned}
            aria-label="Буду смотреть"
            disabled={watched}
            onClick={() => onTogglePlanned?.(!planned)}
            className="h-auto min-w-0 flex-1 whitespace-normal py-2 text-center"
          >
            <Bookmark
              aria-hidden="true"
              className={cn('mr-1 h-4 w-4', planned && 'fill-current')}
            />
            Буду смотреть
          </Button>
        </div>
      </div>
    </article>
  );
}
