import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';
import { resolveSaveMetadata } from '@/modules/catalog';
import { deletePersonalRating, listPersonalRatings, savePersonalRating } from '@/modules/ratings';
import { removeWatchlistForMedia } from '@/modules/watchlist';

import type { UpsertWatchedRecordInput } from './schema';
import type { WatchedRecordEntry } from './types';

export async function saveWatchedRecord(
  actor: Actor,
  input: UpsertWatchedRecordInput,
): Promise<Result<WatchedRecordEntry>> {
  const metadata = await resolveSaveMetadata(input.mediaKind, input.mediaRef);
  if (!metadata.ok) {
    return metadata;
  }

  return withTransaction(async (tx) => {
    const entry = await savePersonalRating(tx, actor.id, input, metadata.value);
    await removeWatchlistForMedia(tx, actor.id, entry.mediaId);
    await recordEvent(tx, {
      actorId: actor.id,
      kind: input.mediaKind === 'film' ? 'film_rated' : 'series_rated',
      mediaId: entry.mediaId,
    });
    return ok(entry);
  });
}

export async function listWatchedRecords(actor: Actor): Promise<Result<WatchedRecordEntry[]>> {
  return ok(await listPersonalRatings(actor.id));
}

export async function deleteWatchedRecord(
  actor: Actor,
  ratingId: number,
): Promise<Result<{ id: number }>> {
  const deleted = await deletePersonalRating(actor.id, ratingId);
  if (!deleted) {
    return err('NOT_FOUND', 'Запись не найдена');
  }
  return ok({ id: ratingId });
}
