-- Up Migration
CREATE TABLE IF NOT EXISTS film_genres (
  id    smallint PRIMARY KEY,
  name  varchar(80) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS film_genres_name_key ON film_genres (name);

CREATE TABLE IF NOT EXISTS series_genres (
  id    smallint PRIMARY KEY,
  name  varchar(80) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS series_genres_name_key ON series_genres (name);

INSERT INTO film_genres (id, name)
SELECT g.id, g.name
  FROM genres g
  JOIN genre_kinds gk ON gk.genre_id = g.id AND gk.kind = 0
ON CONFLICT (id) DO NOTHING;

INSERT INTO series_genres (id, name)
SELECT g.id, g.name
  FROM genres g
  JOIN genre_kinds gk ON gk.genre_id = g.id AND gk.kind = 1
ON CONFLICT (id) DO NOTHING;

DROP TABLE IF EXISTS genre_kinds;
DROP TABLE IF EXISTS genres;

-- Down Migration
CREATE TABLE IF NOT EXISTS genres (
  id    smallint PRIMARY KEY,
  name  varchar(80) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS genres_name_key ON genres (name);

INSERT INTO genres (id, name)
SELECT id, name FROM film_genres
ON CONFLICT DO NOTHING;

INSERT INTO genres (id, name)
SELECT id, name FROM series_genres
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS genre_kinds (
  genre_id  smallint NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  kind      smallint NOT NULL CHECK (kind IN (0, 1)),
  PRIMARY KEY (genre_id, kind)
);

INSERT INTO genre_kinds (genre_id, kind)
SELECT id, 0 FROM film_genres WHERE id IN (SELECT id FROM genres)
ON CONFLICT DO NOTHING;

INSERT INTO genre_kinds (genre_id, kind)
SELECT id, 1 FROM series_genres WHERE id IN (SELECT id FROM genres)
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS series_genres;
DROP TABLE IF EXISTS film_genres;
