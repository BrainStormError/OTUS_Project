import { ok, type Result } from '@/core/result';

import { detailCacheKey, searchCacheKey } from './cache-key';
import { deleteExpiredCache, selectCacheEntry, upsertCacheEntry } from './cache-repository';
import { detailRaw, searchRaw, type SearchParams } from './client';
import { inYearRange, mapDetail, mapSearchItem, selectKnownGenreIds } from './domain';
import {
  listGenres as listStoredGenres,
  listKnownGenreIds,
  listRatedTitles,
} from './repository';
import type {
  CatalogDetail,
  CatalogMediaKind,
  CatalogSearchInput,
  CatalogSearchPage,
  Genre,
  RatedTitle,
  SaveMetadata,
} from './types';

export const TMDB_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const CACHE_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

let lastSweepAt = 0;

function sweepExpiredIfDue(now: number): void {
  if (now - lastSweepAt < CACHE_SWEEP_INTERVAL_MS) {
    return;
  }
  lastSweepAt = now;
  void deleteExpiredCache(new Date(now)).catch(() => undefined);
}

// Read-through: fresh hit returns the stored payload without touching TMDB;
// a miss or expired row fetches TMDB and rewrites the row; a failed fetch
// falls back to the last known (expired) payload when one exists.
async function readThrough<T>(
  cacheKey: string,
  fetcher: () => Promise<Result<T>>,
): Promise<Result<T>> {
  const now = Date.now();
  const cached = await selectCacheEntry(cacheKey);
  if (cached && cached.expiresAt.getTime() > now) {
    return ok(cached.payload as T);
  }

  const fresh = await fetcher();
  if (fresh.ok) {
    await upsertCacheEntry(cacheKey, fresh.value, new Date(now + TMDB_CACHE_TTL_MS));
    sweepExpiredIfDue(now);
    return fresh;
  }
  if (cached) {
    return ok(cached.payload as T);
  }
  return fresh;
}

async function storedGenreMap(): Promise<Map<number, string>> {
  const genres = await listStoredGenres();
  return new Map(genres.map((genre) => [genre.id, genre.name]));
}

export async function listGenres(kind?: CatalogMediaKind): Promise<Result<Genre[]>> {
  return ok(await listStoredGenres(kind));
}

export async function searchCatalog(
  input: CatalogSearchInput,
): Promise<Result<CatalogSearchPage>> {
  const params: SearchParams = {
    query: input.title,
    genreIds: input.genreIds,
    yearFrom: input.yearFrom,
    yearTo: input.yearTo,
    page: input.page,
  };

  const raw = await readThrough(searchCacheKey(input.kind, params), () =>
    searchRaw(input.kind, params),
  );
  if (!raw.ok) {
    return raw;
  }

  const names = await storedGenreMap();

  let items = raw.value.items.map((item) => mapSearchItem(input.kind, item, names));

  const selectedGenres = input.genreIds ?? [];
  if (selectedGenres.length > 0) {
    const selected = new Set(selectedGenres);
    items = items.filter((item) => item.genreIds.some((id) => selected.has(id)));
  }
  items = items.filter((item) => inYearRange(item.year, input.yearFrom, input.yearTo));

  const page = raw.value.page;
  return ok({
    items,
    page,
    hasMore: page < raw.value.totalPages,
  });
}

export async function resolveDetail(
  kind: CatalogMediaKind,
  externalId: string,
): Promise<Result<CatalogDetail>> {
  const raw = await readThrough(detailCacheKey(kind, externalId), () =>
    detailRaw(kind, externalId),
  );
  if (!raw.ok) {
    return raw;
  }
  return ok(mapDetail(kind, raw.value));
}

export async function resolveSaveMetadata(
  kind: CatalogMediaKind,
  externalRef: string,
): Promise<Result<SaveMetadata>> {
  const detail = await resolveDetail(kind, externalRef);
  if (!detail.ok) {
    return detail;
  }
  const known = await listKnownGenreIds();
  const value = detail.value;
  return ok({
    kind,
    externalRef: value.externalId,
    title: value.title,
    year: value.year,
    director: value.director,
    genreIds: selectKnownGenreIds(value.genreIds, known),
  });
}

export async function listCatalog(userId: number, kind: CatalogMediaKind): Promise<Result<RatedTitle[]>> {
  return ok(await listRatedTitles(userId, kind));
}
