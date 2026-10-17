import type { PoolClient } from 'pg';

import type { Actor } from '@/core/auth/policy';
import { err, ok, type Result } from '@/core/result';

import { decodeCursor } from './domain';
import {
  findSignalForUser,
  findVisibleEvent,
  insertActivityEvent,
  isGroupMember,
  listFeedEvents,
  listGroupFeedEvents,
} from './repository';
import type { ListFeedInput } from './schema';
import type {
  ActivityEvent,
  FeedItem,
  ListFeedResult,
  NewActivityEvent,
  SignalKind,
} from './types';

export async function recordEvent(
  tx: PoolClient,
  event: NewActivityEvent,
): Promise<ActivityEvent> {
  return insertActivityEvent(tx, event);
}

export async function listFeed(
  actor: Actor,
  input: ListFeedInput,
): Promise<Result<ListFeedResult>> {
  let cursor = null;
  if (input.cursor) {
    cursor = decodeCursor(input.cursor);
    if (!cursor) {
      return err('VALIDATION', 'Некорректный cursor');
    }
  }

  let since = null;
  if (input.since) {
    since = decodeCursor(input.since);
    if (!since) {
      return err('VALIDATION', 'Некорректный cursor');
    }
  }

  const page = await listFeedEvents({
    viewerId: actor.id,
    limit: input.limit,
    cursor,
    since,
  });
  return ok(page);
}

export async function getVisibleEvent(
  viewerId: number,
  eventId: number,
): Promise<FeedItem | null> {
  return findVisibleEvent(viewerId, eventId);
}

export async function getSignalForUser(
  viewerId: number,
  eventId: number,
): Promise<SignalKind | null> {
  return findSignalForUser(viewerId, eventId);
}

export async function listGroupFeed(
  actor: Actor,
  groupId: number,
  input: ListFeedInput,
): Promise<Result<ListFeedResult>> {
  if (!(await isGroupMember(groupId, actor.id))) {
    return err('FORBIDDEN', 'Лента группы доступна только участникам');
  }

  let cursor = null;
  if (input.cursor) {
    cursor = decodeCursor(input.cursor);
    if (!cursor) {
      return err('VALIDATION', 'Некорректный cursor');
    }
  }

  const page = await listGroupFeedEvents({
    viewerId: actor.id,
    groupId,
    limit: input.limit,
    cursor,
  });
  return ok(page);
}
