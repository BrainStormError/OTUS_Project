-- Up Migration
CREATE TABLE IF NOT EXISTS directory_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description  text,
  owner_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS directory_entries_created_idx
  ON directory_entries (created_at DESC, id DESC);

-- Down Migration
DROP TABLE IF EXISTS directory_entries;
