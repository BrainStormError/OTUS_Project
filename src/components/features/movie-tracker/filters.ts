import type { Movie, SearchFilters } from './types';

export function movieMatches(movie: Movie, filters: SearchFilters = {}): boolean {
  const title = filters.title?.trim().toLowerCase();
  const genres = (filters.genre ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const year = filters.year?.trim();

  if (title && !movie.title.toLowerCase().includes(title)) {
    return false;
  }
  if (genres.length > 0 && !movie.genres.some((genre) => genres.includes(genre.toLowerCase()))) {
    return false;
  }
  if (year && String(movie.year ?? '') !== year) {
    return false;
  }
  return true;
}

export function genreOptions(movies: Movie[]): { value: string; label: string }[] {
  return Array.from(new Set(movies.flatMap((movie) => movie.genres)))
    .sort((a, b) => a.localeCompare(b))
    .map((genre) => ({ value: genre, label: genre }));
}

export function yearOptions(movies: Movie[]): number[] {
  return Array.from(
    new Set(movies.map((movie) => movie.year).filter((year): year is number => year !== null)),
  ).sort((a, b) => b - a);
}
