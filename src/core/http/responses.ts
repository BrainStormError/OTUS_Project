export const CACHE_SINGLE_AUTHOR = 'private, max-age=31536000';
export const CACHE_LIVE_FEED = 'private, max-age=60';
export const CACHE_CATALOG = 'private, max-age=3600';

export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}
