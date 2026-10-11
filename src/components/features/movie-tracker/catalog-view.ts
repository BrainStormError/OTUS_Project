import type { CatalogSearchResult } from '@/modules/catalog';

import type { FilterOption, Movie } from './types';

export type CatalogOptions = { genres: FilterOption[]; years: number[] };

export function genreOptionsFromCatalog(genres: { id: number; name: string }[]): FilterOption[] {
  return genres.map((genre) => ({ value: String(genre.id), label: genre.name }));
}

export function deriveCatalogOptions(items: CatalogSearchResult[]): CatalogOptions {
  const genreMap = new Map<string, string>();
  const yearSet = new Set<number>();
  for (const item of items) {
    item.genreIds.forEach((id, index) => {
      genreMap.set(String(id), item.genres[index] ?? String(id));
    });
    if (item.year !== null) {
      yearSet.add(item.year);
    }
  }
  return {
    genres: Array.from(genreMap, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    years: Array.from(yearSet).sort((a, b) => b - a),
  };
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
