-- Up Migration
CREATE TABLE IF NOT EXISTS activity_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (
                 kind IN (
                   'film_rated',
                   'series_rated',
                   'friendship_accepted',
                   'group_joined',
                   'post_created',
                   'comment_created'
                 )
               ),
  group_id     uuid REFERENCES groups(id) ON DELETE SET NULL,
  target_type  text NOT NULL,
  target_id    text NOT NULL,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_events_keyset_idx
  ON activity_events (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS activity_events_actor_idx
  ON activity_events (actor_id, created_at DESC);

CREATE OR REPLACE FUNCTION notify_activity_event() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('activity_events', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_events_notify
  AFTER INSERT ON activity_events
  FOR EACH ROW EXECUTE FUNCTION notify_activity_event();

-- Down Migration
DROP TRIGGER IF EXISTS activity_events_notify ON activity_events;
DROP FUNCTION IF EXISTS notify_activity_event();
DROP TABLE IF EXISTS activity_events;
