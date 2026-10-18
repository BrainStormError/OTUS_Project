import { ok, type Result } from '@/core/result';

import { TtlCache } from './cache';
import { detailCacheKey, searchCacheKey } from './cache-key';
import {
  deleteExpiredCache,
  deleteOldestCache,
  selectCacheExpiry,
  selectCachePayload,
  selectCacheUsageBytes,
  upsertCacheEntry,
} from './cache-repository';
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

export const CACHE_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

// Storage budget for the TMDB response cache, with a lower hysteresis target so
// eviction stops before the budget boundary and avoids per-sweep churn.
export const TMDB_CACHE_BUDGET_BYTES = 16 * 1024 * 1024;
export const TMDB_CACHE_EVICT_TARGET_BYTES = 14 * 1024 * 1024;

export async function sweepCache(now: Date): Promise<void> {
  await deleteExpiredCache(now);
  const usage = await selectCacheUsageBytes();
  if (usage <= TMDB_CACHE_BUDGET_BYTES) {
    return;
  }
  await deleteOldestCache(usage - TMDB_CACHE_EVICT_TARGET_BYTES);
}

let sweepTimer: ReturnType<typeof setInterval> | undefined;
let sweepInFlight = false;

// Cache maintenance runs on its own timer instead of inline with a request, so
// rendered pages never wait for a sweep. Overlap protection keeps a slow pass
// from stacking behind the interval.
async function runCacheSweep(now: Date): Promise<void> {
  if (sweepInFlight) {
    return;
  }
  sweepInFlight = true;
  try {
    await sweepCache(now);
  } catch {
    // Maintenance must not crash the process; the next pass retries.
  } finally {
    sweepInFlight = false;
  }
}

export function startCacheSweep(): void {
  if (sweepTimer) {
    return;
  }
  sweepTimer = setInterval(() => {
    void runCacheSweep(new Date());
  }, CACHE_SWEEP_INTERVAL_MS);
  // Never hold the process open just for a maintenance timer.
  sweepTimer.unref?.();
}

export function stopCacheSweep(): void {
  if (!sweepTimer) {
    return;
  }
  clearInterval(sweepTimer);
  sweepTimer = undefined;
}

// Read-through: fresh hit returns the stored payload without touching TMDB;
// a miss or expired row fetches TMDB and rewrites the row; a failed fetch
// falls back to the last known (expired) payload when one exists.
async function readThrough<T>(
  cacheKey: string,
  fetcher: () => Promise<Result<T>>,
): Promise<Result<T>> {
  const now = Date.now();
  // Freshness is decided from the expiry alone; the payload is only lifted for
  // an entry we are about to serve.
  const expiresAt = await selectCacheExpiry(cacheKey);
  if (expiresAt && expiresAt.getTime() > now) {
    const payload = await selectCachePayload(cacheKey);
    if (payload !== undefined) {
      return ok(payload as T);
    }
  }

  const fresh = await fetcher();
  if (fresh.ok) {
    await upsertCacheEntry(cacheKey, fresh.value, new Date(now + TMDB_CACHE_TTL_MS));
    return fresh;
  }
  if (expiresAt) {
    const payload = await selectCachePayload(cacheKey);
    if (payload !== undefined) {
      return ok(payload as T);
    }
  }
  return fresh;
}

// The stored genre catalogs change only through the deploy-time sync script,
// which restarts the process, so a short in-process TTL is enough to stop
// re-reading them from the database on every search and every /api/genres call.
const GENRES_CACHE_TTL_MS = 10 * 60 * 1000;
const genresCache = new TtlCache<Genre[]>(GENRES_CACHE_TTL_MS);

async function cachedGenres(kind: CatalogMediaKind): Promise<Genre[]> {
  const cached = genresCache.get(kind);
  if (cached) {
    return cached;
  }
  const genres = await listStoredGenres(kind);
  genresCache.set(kind, genres);
  return genres;
}

async function storedGenreMap(kind: CatalogMediaKind): Promise<Map<number, string>> {
  const genres = await cachedGenres(kind);
  return new Map(genres.map((genre) => [genre.id, genre.name]));
}

export async function listGenres(kind: CatalogMediaKind): Promise<Result<Genre[]>> {
  return ok(await cachedGenres(kind));
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

  const names = await storedGenreMap(input.kind);

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
  const known = await listKnownGenreIds(kind);
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
