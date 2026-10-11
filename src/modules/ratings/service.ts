import type { PoolClient } from 'pg';

import type { SaveMetadata } from '@/modules/catalog';

import {
  deletePersonalRating as deletePersonalRatingRepository,
  findMediaIdByRef,
  hasGroupRating as hasGroupRatingRepository,
  hasGroupRatingTx,
  hasPersonalRating as hasPersonalRatingRepository,
  listGroupRatings as listGroupRatingsRepository,
  listPersonalRatings as listPersonalRatingsRepository,
  upsertGroupRating as upsertGroupRatingRepository,
  upsertMedia,
  upsertPersonalRating as upsertPersonalRatingRepository,
} from './repository';
import type { RatingInput } from './schema';
import type {
  GroupRatingMember,
  GroupRatingSummary,
  MediaKind,
  RatingEntry,
} from './types';

export async function saveMediaMetadata(tx: PoolClient, metadata: SaveMetadata): Promise<number> {
  return upsertMedia(tx, metadata);
}

export async function savePersonalRating(
  tx: PoolClient,
  userId: number,
  input: RatingInput,
  metadata: SaveMetadata,
): Promise<RatingEntry> {
  const mediaId = await saveMediaMetadata(tx, metadata);
  return upsertPersonalRatingRepository(tx, userId, mediaId, input);
}

export async function saveGroupRating(
  tx: PoolClient,
  userId: number,
  groupId: number,
  input: RatingInput,
  metadata: SaveMetadata,
  canStart: boolean,
): Promise<GroupRatingMember | null> {
  const mediaId = await upsertMedia(tx, metadata);
  if (!canStart && !(await hasGroupRatingTx(tx, groupId, mediaId))) {
    return null;
  }
  return upsertGroupRatingRepository(tx, userId, groupId, mediaId, input);
}

export async function listPersonalRatings(userId: number): Promise<RatingEntry[]> {
  return listPersonalRatingsRepository(userId);
}

export async function listGroupRatings(groupId: number): Promise<GroupRatingSummary[]> {
  return listGroupRatingsRepository(groupId);
}

export async function hasGroupRating(groupId: number, mediaId: number): Promise<boolean> {
  return hasGroupRatingRepository(groupId, mediaId);
}

export async function findMediaId(
  tx: PoolClient,
  kind: MediaKind,
  externalRef: string,
): Promise<number | null> {
  return findMediaIdByRef(tx, kind, externalRef);
}

export async function hasPersonalRating(
  tx: PoolClient,
  userId: number,
  mediaId: number,
): Promise<boolean> {
  return hasPersonalRatingRepository(tx, userId, mediaId);
}

export async function deletePersonalRating(
  userId: number,
  ratingId: number,
): Promise<boolean> {
  return deletePersonalRatingRepository(userId, ratingId);
}
