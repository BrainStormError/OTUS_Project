-- Up Migration
-- Invalidation signals (kind 6..9) are written with group_id NULL and an explicit
-- target_user_id: the group-deletion cleanup (DELETE FROM activity_events WHERE
-- group_id = $1) must never remove them, and the ON DELETE SET NULL foreign key
-- must have nothing to null. Insert signals in the same transaction as the change.
ALTER TABLE activity_events DROP CONSTRAINT IF EXISTS activity_events_kind_check;
ALTER TABLE activity_events
  ADD CONSTRAINT activity_events_kind_check CHECK (kind IN (0, 1, 2, 3, 4, 5, 6, 7, 8, 9));

ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS target_user_id bigint REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS activity_events_target_idx
  ON activity_events (target_user_id)
  WHERE target_user_id IS NOT NULL;

-- Down Migration
DELETE FROM activity_events WHERE kind IN (6, 7, 8, 9);
DROP INDEX IF EXISTS activity_events_target_idx;
ALTER TABLE activity_events DROP COLUMN IF EXISTS target_user_id;
ALTER TABLE activity_events DROP CONSTRAINT IF EXISTS activity_events_kind_check;
ALTER TABLE activity_events
  ADD CONSTRAINT activity_events_kind_check CHECK (kind IN (0, 1, 2, 3, 4, 5));
