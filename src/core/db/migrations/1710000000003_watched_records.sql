-- Up Migration
CREATE TABLE IF NOT EXISTS watched_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_kind  text NOT NULL CHECK (media_kind IN ('film', 'series')),
  media_ref   text NOT NULL,
  title       text NOT NULL,
  year        integer,
  genres      text[] NOT NULL DEFAULT '{}',
  rating      numeric(3, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  comment     text,
  watched_at  date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watched_records_media_key UNIQUE (user_id, media_kind, media_ref)
);

CREATE INDEX IF NOT EXISTS watched_records_user_keyset_idx
  ON watched_records (user_id, created_at DESC, id DESC);

-- Down Migration
DROP TABLE IF EXISTS watched_records;
