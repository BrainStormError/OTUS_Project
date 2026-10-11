const { Client } = require('pg');

// Fetches every film and TV genre from TMDB and upserts it into the local
// `genres` table, so screens can offer the full catalog without a live TMDB
// genre call. CommonJS + the global fetch (Node 22), matching scripts/migrate.cjs,
// so the migrator image can run it as a one-off deploy step.

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

  // Film and TV genres share ids; keep one localized name per id, film first.
  const byId = new Map();
  for (const genre of [...filmGenres, ...tvGenres]) {
    if (typeof genre?.id !== 'number' || typeof genre?.name !== 'string') {
      continue;
    }
    byId.set(genre.id, genre.name);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  let upserted = 0;
  let skipped = 0;
  try {
    // Each upsert autocommits so one row that violates UNIQUE(name) can be
    // skipped and logged without aborting the rest of the sync.
    for (const [id, name] of byId) {
      try {
        await client.query(
          `INSERT INTO genres (id, name) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = excluded.name`,
          [id, name],
        );
        upserted += 1;
      } catch (error) {
        if (error && error.code === '23505') {
          skipped += 1;
          console.warn(`warning: skipping genre ${id} "${name}" (duplicate name)`);
          continue;
        }
        throw error;
      }
    }
  } finally {
    await client.end();
  }

  console.log(`Genre sync complete: ${upserted} upserted, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
