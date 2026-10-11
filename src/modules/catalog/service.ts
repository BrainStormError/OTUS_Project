import { ok, type Result } from '@/core/result';

import { detailRaw, searchRaw } from './client';
import { TtlCache } from './cache';
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

export const CATALOG_CACHE_TTL_MS = 60_000;

const searchCache = new TtlCache<CatalogSearchPage>(CATALOG_CACHE_TTL_MS);
const detailCache = new TtlCache<CatalogDetail>(CATALOG_CACHE_TTL_MS);
const genreCache = new TtlCache<Map<number, string>>(CATALOG_CACHE_TTL_MS * 10);

export function resetCatalogCache(): void {
  searchCache.clear();
  detailCache.clear();
  genreCache.clear();
}

async function storedGenreMap(): Promise<Map<number, string>> {
  const cached = genreCache.get('all');
  if (cached) {
    return cached;
  }
  const genres = await listStoredGenres();
  const map = new Map(genres.map((genre) => [genre.id, genre.name]));
  genreCache.set('all', map);
  return map;
}

export async function listGenres(kind?: CatalogMediaKind): Promise<Result<Genre[]>> {
  return ok(await listStoredGenres(kind));
}

export async function searchCatalog(
  input: CatalogSearchInput,
): Promise<Result<CatalogSearchPage>> {
  const key = JSON.stringify(input);
  const cached = searchCache.get(key);
  if (cached) {
    return ok(cached);
  }

  const raw = await searchRaw(input.kind, {
    query: input.title,
    genreIds: input.genreIds,
    yearFrom: input.yearFrom,
    yearTo: input.yearTo,
    page: input.page,
  });
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
  const result: CatalogSearchPage = {
    items,
    page,
    hasMore: page < raw.value.totalPages,
  };

  searchCache.set(key, result);
  return ok(result);
}

export async function resolveDetail(
  kind: CatalogMediaKind,
  externalId: string,
): Promise<Result<CatalogDetail>> {
  const key = `${kind}:${externalId}`;
  const cached = detailCache.get(key);
  if (cached) {
    return ok(cached);
  }
  const raw = await detailRaw(kind, externalId);
  if (!raw.ok) {
    return raw;
  }
  const detail = mapDetail(kind, raw.value);
  detailCache.set(key, detail);
  return ok(detail);
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
