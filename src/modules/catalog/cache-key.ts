import type { SearchParams } from './client';
import { TMDB_LANGUAGE } from './client';
import type { CatalogMediaKind } from './types';

// Deterministic cache key: fixed segment order, whitespace-collapsed query,
// ascending genre ids, language pinned. No locale lowercasing so two distinct
// queries that differ only by case keep distinct entries.
function normalizeQuery(query?: string): string {
  return (query ?? '').trim().replace(/\s+/g, ' ');
}

export function searchCacheKey(
  kind: CatalogMediaKind,
  params: SearchParams,
): string {
  const segments = [`search:${kind}`];
  const query = normalizeQuery(params.query);
  if (query) {
    segments.push(`q=${query}`);
  }
  if (params.genreIds && params.genreIds.length > 0) {
    const sorted = [...params.genreIds].sort((a, b) => a - b);
    segments.push(`g=${sorted.join(',')}`);
  }
  if (params.yearFrom !== undefined) {
    segments.push(`yf=${params.yearFrom}`);
  }
  if (params.yearTo !== undefined) {
    segments.push(`yt=${params.yearTo}`);
  }
  segments.push(`p=${params.page && params.page > 0 ? params.page : 1}`);
  segments.push(`lang=${TMDB_LANGUAGE}`);
  return segments.join('|');
}

export function detailCacheKey(
  kind: CatalogMediaKind,
  externalId: string,
): string {
  return `detail:${kind}:${externalId}|lang=${TMDB_LANGUAGE}`;
}
