-- Up Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_hidden boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS users_handle_key
  ON users (handle)
  WHERE handle IS NOT NULL;

-- Down Migration
DROP INDEX IF EXISTS users_handle_key;
ALTER TABLE users DROP COLUMN IF EXISTS profile_hidden;
ALTER TABLE users DROP COLUMN IF EXISTS handle;
