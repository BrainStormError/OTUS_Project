import type { CatalogSearchResult } from '@/modules/catalog';

import type { FilterOption, Movie } from './types';

export function genreOptionsFromCatalog(genres: { id: number; name: string }[]): FilterOption[] {
  return genres.map((genre) => ({ value: String(genre.id), label: genre.name }));
}

export function toMovie(item: CatalogSearchResult & { director?: string | null }): Movie {
  return {
    tmdbId: Number(item.externalId),
    kind: item.kind,
    title: item.title,
    year: item.year,
    rating: item.externalRating ?? 0,
    genres: item.genres,
    director: item.director ?? undefined,
    posterUrl: item.posterUrl,
  };
}

export function mediaKey(movie: Pick<Movie, 'kind' | 'tmdbId'>): string {
  return `${movie.kind}:${movie.tmdbId}`;
}
