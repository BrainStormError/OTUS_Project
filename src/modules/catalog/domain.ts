import type { RawDetail, RawSearchItem } from './client';
import type { CatalogDetail, CatalogMediaKind, CatalogSearchResult } from './types';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export function posterUrlFromPath(path: string | null | undefined): string | null {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

export function yearFromDate(date: string | undefined | null): number | null {
  if (!date || date.length < 4) {
    return null;
  }
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) && year >= 1800 && year <= 2200 ? year : null;
}

export function inYearRange(year: number | null, yearFrom?: number, yearTo?: number): boolean {
  if (yearFrom === undefined && yearTo === undefined) {
    return true;
  }
  if (year === null) {
    return false;
  }
  if (yearFrom !== undefined && year < yearFrom) {
    return false;
  }
  if (yearTo !== undefined && year > yearTo) {
    return false;
  }
  return true;
}

export function selectKnownGenreIds(reported: readonly number[], known: readonly number[]): number[] {
  const knownSet = new Set(known);
  const seen = new Set<number>();
  const selected: number[] = [];
  for (const id of reported) {
    if (knownSet.has(id) && !seen.has(id)) {
      seen.add(id);
      selected.push(id);
    }
  }
  return selected;
}

export function genreNames(genreIds: readonly number[], namesById: ReadonlyMap<number, string>): string[] {
  return genreIds.map((id) => namesById.get(id) ?? String(id));
}

export function mapSearchItem(
  kind: CatalogMediaKind,
  item: RawSearchItem,
  namesById: ReadonlyMap<number, string>,
): CatalogSearchResult {
  const genreIds = item.genre_ids ?? [];
  return {
    kind,
    externalId: String(item.id),
    title: (kind === 'film' ? item.title : item.name) ?? '',
    year: yearFromDate(kind === 'film' ? item.release_date : item.first_air_date),
    posterUrl: posterUrlFromPath(item.poster_path),
    externalRating: typeof item.vote_average === 'number' ? item.vote_average : null,
    genres: genreNames(genreIds, namesById),
    genreIds,
  };
}

function directorFromDetail(kind: CatalogMediaKind, detail: RawDetail): string | null {
  if (kind === 'film') {
    const director = detail.credits?.crew?.find((member) => member.job === 'Director');
    return director?.name ?? null;
  }
  const creators = (detail.created_by ?? [])
    .map((creator) => creator.name)
    .filter((name): name is string => Boolean(name));
  return creators.length > 0 ? creators.join(', ') : null;
}

export function mapDetail(kind: CatalogMediaKind, detail: RawDetail): CatalogDetail {
  const genres = detail.genres ?? [];
  return {
    kind,
    externalId: String(detail.id),
    title: (kind === 'film' ? detail.title : detail.name) ?? '',
    year: yearFromDate(kind === 'film' ? detail.release_date : detail.first_air_date),
    posterUrl: posterUrlFromPath(detail.poster_path),
    externalRating: typeof detail.vote_average === 'number' ? detail.vote_average : null,
    genres: genres.map((genre) => genre.name),
    genreIds: genres.map((genre) => genre.id),
    overview: detail.overview ?? null,
    director: directorFromDetail(kind, detail),
  };
}
