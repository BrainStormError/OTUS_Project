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

  // Film and TV genres share ids; keep one localized name per id, film first,
  // and record which kinds each id belongs to (kind 0 = film, kind 1 = TV).
  const byId = new Map();
  const kindsById = new Map();
  function record(genre, kind) {
    if (typeof genre?.id !== 'number' || typeof genre?.name !== 'string') {
      return;
    }
    byId.set(genre.id, genre.name);
    const kinds = kindsById.get(genre.id) ?? new Set();
    kinds.add(kind);
    kindsById.set(genre.id, kinds);
  }
  for (const genre of filmGenres) {
    record(genre, 0);
  }
  for (const genre of tvGenres) {
    record(genre, 1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  let upserted = 0;
  let skipped = 0;
  const skippedIds = new Set();
  let links = 0;
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
          skippedIds.add(id);
          console.warn(`warning: skipping genre ${id} "${name}" (duplicate name)`);
          continue;
        }
        throw error;
      }
    }

    // Kind membership is idempotent: an existing link is left untouched, so a
    // second run adds nothing and the row count stays the same.
    for (const [id, kinds] of kindsById) {
      if (skippedIds.has(id)) {
        continue;
      }
      for (const kind of kinds) {
        const result = await client.query(
          `INSERT INTO genre_kinds (genre_id, kind) VALUES ($1, $2)
           ON CONFLICT (genre_id, kind) DO NOTHING`,
          [id, kind],
        );
        links += result.rowCount ?? 0;
      }
    }
  } finally {
    await client.end();
  }

  console.log(
    `Genre sync complete: ${upserted} upserted, ${skipped} skipped, ${links} kind links added.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
