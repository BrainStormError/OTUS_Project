import { vi } from 'vitest';

export type TmdbFixture = {
  title: string;
  year?: number;
  director?: string;
  genreIds?: number[];
};

function numericId(ref: string): number {
  if (/^\d+$/.test(ref)) {
    return Number(ref);
  }
  let hash = 0;
  for (let index = 0; index < ref.length; index += 1) {
    hash = (hash * 31 + ref.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

// Stubs the global fetch used by the catalog client with TMDB-shaped detail
// responses, so integration tests exercise the real save path without network.
export function installTmdbFetch(resolve: (ref: string) => TmdbFixture | undefined) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const match = url.match(/\/(movie|tv)\/([^?]+)/);
    if (!match) {
      return new Response(JSON.stringify({ genres: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const kind = match[1] as 'movie' | 'tv';
    const ref = decodeURIComponent(match[2]!);
    const fixture = resolve(ref);
    if (!fixture) {
      return new Response('not found', { status: 404 });
    }

    const date = fixture.year ? `${fixture.year}-01-01` : undefined;
    const body = {
      id: numericId(ref),
      title: kind === 'movie' ? fixture.title : undefined,
      name: kind === 'tv' ? fixture.title : undefined,
      release_date: kind === 'movie' ? date : undefined,
      first_air_date: kind === 'tv' ? date : undefined,
      genres: (fixture.genreIds ?? []).map((id) => ({ id, name: `Genre ${id}` })),
      credits: {
        crew: fixture.director ? [{ job: 'Director', name: fixture.director }] : [],
      },
      created_by: fixture.director ? [{ name: fixture.director }] : [],
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
