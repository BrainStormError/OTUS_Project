-- Up Migration
ALTER TABLE media ADD COLUMN IF NOT EXISTS director varchar(200);

-- Down Migration
ALTER TABLE media DROP COLUMN IF EXISTS director;
