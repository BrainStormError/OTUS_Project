import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import { encodeCursor } from './domain';
import type {
  ActivityCursor,
  ActivityEvent,
  ActivityKind,
  FeedItem,
  ListFeedResult,
  NewActivityEvent,
} from './types';

const KIND_CODE: Record<ActivityKind, number> = {
  film_rated: 0,
  series_rated: 1,
  friendship_accepted: 2,
  group_joined: 3,
  post_created: 4,
  comment_created: 5,
};

const KIND_NAME: Record<number, ActivityKind> = {
  0: 'film_rated',
  1: 'series_rated',
  2: 'friendship_accepted',
  3: 'group_joined',
  4: 'post_created',
  5: 'comment_created',
};

const COMMENT_KIND_CODE = KIND_CODE.comment_created;

// Feed retention: events survive at most one day. The delete runs lazily on
// read, throttled to once a minute per process so frequent reads do not each
// issue a write.
const PRUNE_INTERVAL_MS = 60_000;
let lastPrunedAt = 0;

export async function pruneStaleActivityEvents(): Promise<number> {
  const rows = await query<{ id: number }>(
    `DELETE FROM activity_events
      WHERE created_at < now() - interval '1 day'
      RETURNING id`,
  );
  return rows.length;
}

async function pruneStaleActivityEventsThrottled(): Promise<void> {
  const now = Date.now();
  if (now - lastPrunedAt < PRUNE_INTERVAL_MS) {
    return;
  }
  lastPrunedAt = now;
  await pruneStaleActivityEvents();
}

type EventRow = {
  id: number;
  actor_id: number;
  kind: number;
  group_id: number | null;
  media_id: number | null;
  discussion_id: number | null;
  created_at: Date;
};

type FeedRow = EventRow & {
  actor_name: string | null;
  actor_handle: string | null;
  group_name: string | null;
  media_title: string | null;
  media_kind: number | null;
  media_ref: string | null;
  rating_value: number | null;
  linked_discussion_id: number | null;
  linked_discussion_title: string | null;
};

const EVENT_COLUMNS = 'id, actor_id, kind, group_id, media_id, discussion_id, created_at';

const FEED_COLUMNS = `e.id, e.actor_id, e.kind, e.group_id, e.media_id,
  COALESCE(e.discussion_id, dm.id) AS discussion_id, e.created_at,
  u.name AS actor_name, u.handle AS actor_handle, g.name AS group_name,
  m.title AS media_title, m.kind AS media_kind, m.external_ref AS media_ref,
  r.rating AS rating_value, dm.id AS linked_discussion_id, dd.title AS linked_discussion_title`;

const FEED_FROM = `FROM activity_events e
  JOIN users u ON u.id = e.actor_id
  LEFT JOIN groups g ON g.id = e.group_id
  LEFT JOIN media m ON m.id = e.media_id
  LEFT JOIN ratings r
    ON r.user_id = e.actor_id
   AND r.media_id = e.media_id
   AND r.group_id IS NOT DISTINCT FROM e.group_id
  LEFT JOIN group_discussions dm
    ON dm.group_id = e.group_id AND dm.media_id = e.media_id AND e.media_id IS NOT NULL
  LEFT JOIN group_discussions dd ON dd.id = e.discussion_id`;

const VIEWER_VISIBILITY = `(
  e.actor_id = $1
  OR (
    e.group_id IS NULL
    AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 1
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

function mapActivityEvent(row: EventRow): ActivityEvent {
  return {
    id: row.id,
    actorId: row.actor_id,
    kind: KIND_NAME[row.kind] ?? 'film_rated',
    groupId: row.group_id,
    mediaId: row.media_id,
    discussionId: row.discussion_id,
    createdAt: row.created_at.toISOString(),
  };
}

function deriveHref(row: FeedRow): string | null {
  switch (KIND_NAME[row.kind]) {
    case 'film_rated':
    case 'series_rated':
      return row.media_kind === 0 ? `/film/${row.media_ref}` : '/series';
    case 'friendship_accepted':
      return row.actor_handle ? `/u/${row.actor_handle}` : null;
    case 'group_joined':
      return row.group_id ? `/groups/${row.group_id}` : null;
    case 'post_created':
    case 'comment_created':
      return row.discussion_id && row.group_id
        ? `/groups/${row.group_id}?tab=discussions&discussion=${row.discussion_id}`
        : null;
    default:
      return null;
  }
}

function deriveTitle(row: FeedRow): string | null {
  switch (KIND_NAME[row.kind]) {
    case 'film_rated':
    case 'series_rated':
      return row.media_title;
    case 'friendship_accepted':
      return 'Новая дружба';
    case 'group_joined':
      return row.group_name;
    case 'post_created':
    case 'comment_created':
      return row.linked_discussion_title;
    default:
      return null;
  }
}

function deriveRating(row: FeedRow): number | null {
  if (KIND_NAME[row.kind] !== 'film_rated' && KIND_NAME[row.kind] !== 'series_rated') {
    return null;
  }
  return row.rating_value === null ? null : row.rating_value / 10;
}

function mapFeedItem(row: FeedRow): FeedItem {
  return {
    ...mapActivityEvent(row),
    actorName: row.actor_name,
    actorHandle: row.actor_handle,
    groupName: row.group_name,
    title: deriveTitle(row),
    rating: deriveRating(row),
    href: deriveHref(row),
  };
}

export async function insertActivityEvent(
  tx: PoolClient,
  event: NewActivityEvent,
): Promise<ActivityEvent> {
  const result = await tx.query<EventRow>(
    `INSERT INTO activity_events (actor_id, kind, group_id, media_id, discussion_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${EVENT_COLUMNS}`,
    [
      event.actorId,
      KIND_CODE[event.kind],
      event.groupId ?? null,
      event.mediaId ?? null,
      event.discussionId ?? null,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('insertActivityEvent returned no row');
  }
  return mapActivityEvent(row);
}

export async function listFeedEvents(params: {
  viewerId: number;
  limit: number;
  cursor: ActivityCursor | null;
  since: ActivityCursor | null;
}): Promise<ListFeedResult> {
  const { viewerId, limit, cursor, since } = params;
  await pruneStaleActivityEventsThrottled();
  const rows = await query<FeedRow>(
    `SELECT ${FEED_COLUMNS}
       ${FEED_FROM}
      WHERE ${VIEWER_VISIBILITY}
        AND e.kind <> ${COMMENT_KIND_CODE}
        AND e.created_at > now() - interval '1 day'
        AND ($2::timestamptz IS NULL OR (e.created_at, e.id) < ($2::timestamptz, $3::bigint))
        AND ($4::timestamptz IS NULL OR (e.created_at, e.id) > ($4::timestamptz, $5::bigint))
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
  viewerId: number,
  eventId: number,
): Promise<FeedItem | null> {
  const rows = await query<FeedRow>(
    `SELECT ${FEED_COLUMNS}
       ${FEED_FROM}
      WHERE ${VIEWER_VISIBILITY}
        AND e.kind <> ${COMMENT_KIND_CODE}
        AND e.id = $2`,
    [viewerId, eventId],
  );
  const row = rows[0];
  return row ? mapFeedItem(row) : null;
}

export async function isGroupMember(groupId: number, userId: number): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
     ) AS exists`,
    [groupId, userId],
  );
  return rows[0]?.exists === true;
}

export async function listGroupFeedEvents(params: {
  viewerId: number;
  groupId: number;
  limit: number;
  cursor: ActivityCursor | null;
}): Promise<ListFeedResult> {
  const { viewerId, groupId, limit, cursor } = params;
  await pruneStaleActivityEventsThrottled();
  const rows = await query<FeedRow>(
    `SELECT ${FEED_COLUMNS}
       ${FEED_FROM}
      WHERE e.group_id = $2
        AND e.kind <> ${COMMENT_KIND_CODE}
        AND e.created_at > now() - interval '1 day'
        AND (e.actor_id = $1 OR u.profile_hidden = false)
        AND ($3::timestamptz IS NULL OR (e.created_at, e.id) < ($3::timestamptz, $4::bigint))
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $5`,
    [
      viewerId,
      groupId,
      cursor?.createdAt ?? null,
      cursor?.id ?? null,
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
