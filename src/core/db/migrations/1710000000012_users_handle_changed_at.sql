-- Up Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_changed_at timestamptz;

-- Down Migration
ALTER TABLE users DROP COLUMN IF EXISTS handle_changed_at;
