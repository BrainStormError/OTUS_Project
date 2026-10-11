import { env } from '@/core/config/env';
import { withTimeout } from '@/core/http/timeout';
import { err, ok, type Result } from '@/core/result';

import type { CatalogMediaKind } from './types';

const API_BASE = 'https://api.themoviedb.org/3';

export const TMDB_REQUEST_TIMEOUT_MS = 5000;

export type RawGenre = { id: number; name: string };

export type RawSearchItem = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
};

export type RawDetail = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  overview?: string | null;
  genres?: RawGenre[];
  created_by?: { name?: string }[];
  credits?: { crew?: { job?: string; name?: string }[] };
};

export type SearchParams = {
  query?: string;
  genreIds?: number[];
  yearFrom?: number;
  yearTo?: number;
  page?: number;
};

export type RawSearchPage = {
  items: RawSearchItem[];
  page: number;
  totalPages: number;
};

function segmentFor(kind: CatalogMediaKind): 'movie' | 'tv' {
  return kind === 'film' ? 'movie' : 'tv';
}

// TMDB `/discover` accepts inclusive date bounds per kind. `/search` (the title
// path) has no date-range parameter, so the range is applied in memory instead.
function dateRangeParams(
  kind: CatalogMediaKind,
  params: SearchParams,
): Record<string, string | undefined> {
  if (kind === 'film') {
    return {
      'primary_release_date.gte': params.yearFrom !== undefined ? `${params.yearFrom}-01-01` : undefined,
      'primary_release_date.lte': params.yearTo !== undefined ? `${params.yearTo}-12-31` : undefined,
    };
  }
  return {
    'first_air_date.gte': params.yearFrom !== undefined ? `${params.yearFrom}-01-01` : undefined,
    'first_air_date.lte': params.yearTo !== undefined ? `${params.yearTo}-12-31` : undefined,
  };
}

type RawPage = {
  results?: RawSearchItem[];
  page?: number;
  total_pages?: number;
};

function toRawPage(body: RawPage): RawSearchPage {
  return {
    items: body.results ?? [],
    page: typeof body.page === 'number' && body.page > 0 ? body.page : 1,
    totalPages: typeof body.total_pages === 'number' && body.total_pages > 0 ? body.total_pages : 1,
  };
}

async function request<T>(
  path: string,
  params: Record<string, string | undefined>,
): Promise<Result<T>> {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('language', 'ru-RU');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await withTimeout(
      fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }),
      TMDB_REQUEST_TIMEOUT_MS,
    );
    if (!response.ok) {
      if (response.status === 404) {
        return err('NOT_FOUND', 'Тайтл не найден в TMDB');
      }
      return err('INTERNAL', 'Не удалось получить данные TMDB');
    }
    return ok((await response.json()) as T);
  } catch {
    return err('INTERNAL', 'Не удалось получить данные TMDB');
  }
}

export async function searchRaw(
  kind: CatalogMediaKind,
  params: SearchParams,
): Promise<Result<RawSearchPage>> {
  const segment = segmentFor(kind);
  const query = params.query?.trim();
  const page = params.page && params.page > 0 ? String(params.page) : '1';

  if (query) {
    const result = await request<RawPage>(`/search/${segment}`, {
      query,
      include_adult: 'false',
      page,
    });
    return result.ok ? ok(toRawPage(result.value)) : result;
  }

  const result = await request<RawPage>(`/discover/${segment}`, {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page,
    with_genres: params.genreIds?.length ? params.genreIds.join('|') : undefined,
    ...dateRangeParams(kind, params),
  });
  return result.ok ? ok(toRawPage(result.value)) : result;
}

export async function detailRaw(
  kind: CatalogMediaKind,
  externalId: string,
): Promise<Result<RawDetail>> {
  const segment = segmentFor(kind);
  const append = kind === 'film' ? 'credits' : undefined;
  return request<RawDetail>(`/${segment}/${encodeURIComponent(externalId)}`, {
    append_to_response: append,
  });
}

export async function genreListRaw(kind: CatalogMediaKind): Promise<Result<RawGenre[]>> {
  const result = await request<{ genres?: RawGenre[] }>(`/genre/${segmentFor(kind)}/list`, {});
  return result.ok ? ok(result.value.genres ?? []) : result;
}
