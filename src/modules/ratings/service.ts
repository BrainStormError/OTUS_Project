import type { PoolClient } from 'pg';

import type { SaveMetadata } from '@/modules/catalog';

import {
  deletePersonalRating as deletePersonalRatingRepository,
  hasGroupRating as hasGroupRatingRepository,
  listGroupRatings as listGroupRatingsRepository,
  listPersonalRatings as listPersonalRatingsRepository,
  upsertGroupRating as upsertGroupRatingRepository,
  upsertMedia,
  upsertPersonalRating as upsertPersonalRatingRepository,
} from './repository';
import type { RatingInput } from './schema';
import type { GroupRatingMember, GroupRatingSummary, RatingEntry } from './types';

export async function savePersonalRating(
  tx: PoolClient,
  userId: number,
  input: RatingInput,
  metadata: SaveMetadata,
): Promise<RatingEntry> {
  const mediaId = await upsertMedia(tx, metadata);
  return upsertPersonalRatingRepository(tx, userId, mediaId, input);
}

export async function saveGroupRating(
  tx: PoolClient,
  userId: number,
  groupId: number,
  input: RatingInput,
  metadata: SaveMetadata,
): Promise<GroupRatingMember> {
  const mediaId = await upsertMedia(tx, metadata);
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

export async function deletePersonalRating(
  userId: number,
  ratingId: number,
): Promise<boolean> {
  return deletePersonalRatingRepository(userId, ratingId);
}
