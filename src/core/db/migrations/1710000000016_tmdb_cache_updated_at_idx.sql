-- Up Migration
-- Supports oldest-first eviction ordering for the size-bounded TMDB cache.
CREATE INDEX IF NOT EXISTS tmdb_cache_updated_at_idx
  ON tmdb_cache (updated_at);

-- Down Migration
DROP INDEX IF EXISTS tmdb_cache_updated_at_idx;
