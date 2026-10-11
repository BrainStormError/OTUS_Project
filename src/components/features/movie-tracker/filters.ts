import type { Movie, SearchFilters, WatchedRecord } from './types';

function parseBound(value?: string): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function inYearRange(year: number | null, yearFrom?: string, yearTo?: string): boolean {
  const from = parseBound(yearFrom);
  const to = parseBound(yearTo);
  if (from === null && to === null) {
    return true;
  }
  if (year === null) {
    return false;
  }
  if (from !== null && year < from) {
    return false;
  }
  if (to !== null && year > to) {
    return false;
  }
  return true;
}

export function movieMatches(movie: Movie, filters: SearchFilters = {}): boolean {
  const title = filters.title?.trim().toLowerCase();
  const genres = (filters.genre ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);

  if (title && !movie.title.toLowerCase().includes(title)) {
    return false;
  }
  if (genres.length > 0 && !movie.genres.some((genre) => genres.includes(genre.toLowerCase()))) {
    return false;
  }
  if (!inYearRange(movie.year, filters.yearFrom, filters.yearTo)) {
    return false;
  }
  return true;
}

export function watchedAtYear(watchedAt?: string): number | null {
  const match = /(\d{4})/.exec(watchedAt?.trim() ?? '');
  return match ? Number(match[1]) : null;
}

export function recordMatches(record: WatchedRecord, filters: SearchFilters = {}): boolean {
  const title = filters.title?.trim().toLowerCase();
  const genres = (filters.genre ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);

  if (title && !record.movie.title.toLowerCase().includes(title)) {
    return false;
  }
  if (
    genres.length > 0 &&
    !record.movie.genres.some((genre) => genres.includes(genre.toLowerCase()))
  ) {
    return false;
  }
  if (!inYearRange(watchedAtYear(record.watchedAt), filters.yearFrom, filters.yearTo)) {
    return false;
  }
  return true;
}

export function genreOptions(movies: Movie[]): { value: string; label: string }[] {
  return Array.from(new Set(movies.flatMap((movie) => movie.genres)))
    .sort((a, b) => a.localeCompare(b))
    .map((genre) => ({ value: genre, label: genre }));
}
