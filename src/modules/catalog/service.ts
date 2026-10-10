import { ok, type Result } from '@/core/result';

import { detailRaw, genreListRaw, searchRaw } from './client';
import { TtlCache } from './cache';
import { mapDetail, mapSearchItem, selectKnownGenreIds } from './domain';
import { listKnownGenreIds, listRatedTitles } from './repository';
import type {
  CatalogDetail,
  CatalogMediaKind,
  CatalogSearchInput,
  CatalogSearchResult,
  RatedTitle,
  SaveMetadata,
} from './types';

export const CATALOG_CACHE_TTL_MS = 60_000;

const searchCache = new TtlCache<CatalogSearchResult[]>(CATALOG_CACHE_TTL_MS);
const detailCache = new TtlCache<CatalogDetail>(CATALOG_CACHE_TTL_MS);
const genreCache = new TtlCache<Map<number, string>>(CATALOG_CACHE_TTL_MS * 10);

export function resetCatalogCache(): void {
  searchCache.clear();
  detailCache.clear();
  genreCache.clear();
}

async function genreMap(kind: CatalogMediaKind): Promise<Result<Map<number, string>>> {
  const cached = genreCache.get(kind);
  if (cached) {
    return ok(cached);
  }
  const raw = await genreListRaw(kind);
  if (!raw.ok) {
    return raw;
  }
  const map = new Map(raw.value.map((genre) => [genre.id, genre.name]));
  genreCache.set(kind, map);
  return ok(map);
}

export async function searchCatalog(
  input: CatalogSearchInput,
): Promise<Result<CatalogSearchResult[]>> {
  const key = JSON.stringify(input);
  const cached = searchCache.get(key);
  if (cached) {
    return ok(cached);
  }

  const raw = await searchRaw(input.kind, {
    query: input.title,
    genreIds: input.genreIds,
    year: input.year,
  });
  if (!raw.ok) {
    return raw;
  }

  const names = await genreMap(input.kind);
  if (!names.ok) {
    return names;
  }

  let items = raw.value.map((item) => mapSearchItem(input.kind, item, names.value));

  const selectedGenres = input.genreIds ?? [];
  if (selectedGenres.length > 0) {
    const selected = new Set(selectedGenres);
    items = items.filter((item) => item.genreIds.some((id) => selected.has(id)));
  }
  if (input.year) {
    items = items.filter((item) => item.year === input.year);
  }

  searchCache.set(key, items);
  return ok(items);
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
