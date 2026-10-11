-- Up Migration
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  key           text PRIMARY KEY,
  window_start  timestamptz NOT NULL DEFAULT now(),
  count         integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS rate_limit_counters_window_idx
  ON rate_limit_counters (window_start);

-- Down Migration
DROP TABLE IF EXISTS rate_limit_counters;
