const { Client } = require('pg');

// Fetches every film and TV genre from TMDB and upserts each list into its own
// kind-scoped catalog (`film_genres`, `series_genres`), so screens can offer the
// full catalog without a live TMDB genre call and no genre is dropped for a
// cross-kind name collision. CommonJS + the global fetch (Node 22), matching
// scripts/migrate.cjs, so the migrator image can run it as a one-off deploy step.

const API_BASE = 'https://api.themoviedb.org/3';
const TMDB_TIMEOUT_MS = 10000;

async function fetchGenres(segment, token) {
  const url = new URL(`${API_BASE}/genre/${segment}/list`);
  url.searchParams.set('language', 'ru-RU');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TMDB_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`TMDB ${segment} genres request failed with status ${response.status}`);
    }
    const body = await response.json();
    return Array.isArray(body.genres) ? body.genres : [];
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to sync genres');
  }
  if (!token) {
    throw new Error('TMDB_ACCESS_TOKEN is required to sync genres');
  }

  const [filmGenres, tvGenres] = await Promise.all([
    fetchGenres('movie', token),
    fetchGenres('tv', token),
  ]);

  function valid(genre) {
    return typeof genre?.id === 'number' && typeof genre?.name === 'string';
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  let upserted = 0;
  try {
    // Each list writes into its own table, so the two TMDB namespaces never
    // contend on a shared name and no id is skipped.
    for (const [table, genres] of [
      ['film_genres', filmGenres],
      ['series_genres', tvGenres],
    ]) {
      for (const genre of genres) {
        if (!valid(genre)) {
          continue;
        }
        await client.query(
          `INSERT INTO ${table} (id, name) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = excluded.name`,
          [genre.id, genre.name],
        );
        upserted += 1;
      }
    }
  } finally {
    await client.end();
  }

  console.log(`Genre sync complete: ${upserted} upserted.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
