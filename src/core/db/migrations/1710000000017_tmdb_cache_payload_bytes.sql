-- Up Migration
-- Materialise the payload size so usage accounting and eviction ordering read a
-- stored column instead of recomputing octet_length(payload::text) on every row.
ALTER TABLE tmdb_cache ADD COLUMN IF NOT EXISTS payload_bytes integer;

UPDATE tmdb_cache
   SET payload_bytes = octet_length(payload::text)
 WHERE payload_bytes IS NULL;

ALTER TABLE tmdb_cache ALTER COLUMN payload_bytes SET NOT NULL;

-- Down Migration
ALTER TABLE tmdb_cache DROP COLUMN IF EXISTS payload_bytes;
