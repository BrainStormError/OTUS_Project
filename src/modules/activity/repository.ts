import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import { encodeCursor } from './domain';
import type {
  ActivityCursor,
  ActivityEvent,
  ActivityPayload,
  FeedItem,
  ListFeedResult,
  NewActivityEvent,
} from './types';

type FeedRow = {
  id: string;
  actor_id: string;
  kind: string;
  group_id: string | null;
  target_type: string;
  target_id: string;
  payload: ActivityPayload | null;
  created_at: Date;
  actor_name: string | null;
  actor_handle: string | null;
  group_name: string | null;
};

const EVENT_COLUMNS =
  'id, actor_id, kind, group_id, target_type, target_id, payload, created_at';

const FEED_COLUMNS = `${EVENT_COLUMNS
  .split(', ')
  .map((column) => `e.${column}`)
  .join(', ')}, u.name AS actor_name, u.handle AS actor_handle, g.name AS group_name`;

const VIEWER_VISIBILITY = `(
  e.actor_id = $1
  OR (
    e.group_id IS NULL
    AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = $1 AND f.addressee_id = e.actor_id)
          OR (f.addressee_id = $1 AND f.requester_id = e.actor_id)
        )
    )
  )
  OR (
    e.group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = e.group_id AND gm.user_id = $1
    )
  )
)
AND (e.actor_id = $1 OR u.profile_hidden = false)`;

const FEED_FROM = `FROM activity_events e
  JOIN users u ON u.id = e.actor_id
  LEFT JOIN groups g ON g.id = e.group_id`;

function mapActivityEvent(row: FeedRow): ActivityEvent {
  return {
    id: row.id,
    actorId: row.actor_id,
    kind: row.kind as ActivityEvent['kind'],
    groupId: row.group_id,
    targetType: row.target_type,
    targetId: row.target_id,
    payload: row.payload ?? {},
    createdAt: row.created_at.toISOString(),
  };
}

function mapFeedItem(row: FeedRow): FeedItem {
  return {
    ...mapActivityEvent(row),
    actorName: row.actor_name,
    actorHandle: row.actor_handle,
    groupName: row.group_name,
  };
}

export async function insertActivityEvent(
  tx: PoolClient,
  event: NewActivityEvent,
): Promise<ActivityEvent> {
  const result = await tx.query<FeedRow>(
    `INSERT INTO activity_events (actor_id, kind, group_id, target_type, target_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING ${EVENT_COLUMNS}`,
    [
      event.actorId,
      event.kind,
      event.groupId ?? null,
      event.targetType,
      event.targetId,
      JSON.stringify(event.payload ?? {}),
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('insertActivityEvent returned no row');
  }
  return mapActivityEvent(row);
}

export async function listFeedEvents(params: {
  viewerId: string;
  limit: number;
  cursor: ActivityCursor | null;
  since: ActivityCursor | null;
}): Promise<ListFeedResult> {
  const { viewerId, limit, cursor, since } = params;
  const rows = await query<FeedRow>(
    `SELECT ${FEED_COLUMNS}
       ${FEED_FROM}
      WHERE ${VIEWER_VISIBILITY}
        AND ($2::timestamptz IS NULL OR (e.created_at, e.id) < ($2::timestamptz, $3::uuid))
        AND ($4::timestamptz IS NULL OR (e.created_at, e.id) > ($4::timestamptz, $5::uuid))
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $6`,
    [
      viewerId,
      cursor?.createdAt ?? null,
      cursor?.id ?? null,
      since?.createdAt ?? null,
      since?.id ?? null,
      limit + 1,
    ],
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map(mapFeedItem);
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function findVisibleEvent(
  viewerId: string,
  eventId: string,
): Promise<FeedItem | null> {
  const rows = await query<FeedRow>(
    `SELECT ${FEED_COLUMNS}
       ${FEED_FROM}
      WHERE ${VIEWER_VISIBILITY}
        AND e.id = $2`,
    [viewerId, eventId],
  );
  const row = rows[0];
  return row ? mapFeedItem(row) : null;
}
