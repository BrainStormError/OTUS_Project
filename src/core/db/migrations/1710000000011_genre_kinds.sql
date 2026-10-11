-- Up Migration
CREATE TABLE IF NOT EXISTS genre_kinds (
  genre_id  smallint NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  kind      smallint NOT NULL CHECK (kind IN (0, 1)),
  PRIMARY KEY (genre_id, kind)
);

-- Down Migration
DROP TABLE IF EXISTS genre_kinds;
