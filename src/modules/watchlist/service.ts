import type { PoolClient } from 'pg';

import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { resolveSaveMetadata } from '@/modules/catalog';
import { saveMediaMetadata } from '@/modules/ratings';

import {
  deleteWatchlist,
  deleteWatchlistForMediaTx,
  hasPersonalRating,
  listWatchlist as listWatchlistRepository,
  upsertWatchlist,
} from './repository';
import type { AddWatchlistInput } from './schema';
import type { MediaKind, WatchlistEntry } from './types';

export async function addWatchlist(
  actor: Actor,
  input: AddWatchlistInput,
): Promise<Result<WatchlistEntry>> {
  const metadata = await resolveSaveMetadata(input.mediaKind, input.mediaRef);
  if (!metadata.ok) {
    return metadata;
  }

  return withTransaction(async (tx) => {
    const mediaId = await saveMediaMetadata(tx, metadata.value);
    if (await hasPersonalRating(tx, actor.id, mediaId)) {
      return err('CONFLICT', 'Тайтл уже отмечен просмотренным');
    }
    const entry = await upsertWatchlist(tx, actor.id, mediaId);
    return ok(entry);
  });
}

export async function listWatchlist(
  actor: Actor,
  kind: MediaKind,
): Promise<Result<WatchlistEntry[]>> {
  return ok(await listWatchlistRepository(actor.id, kind));
}

export async function removeWatchlist(
  actor: Actor,
  id: number,
): Promise<Result<{ id: number }>> {
  const deleted = await deleteWatchlist(actor.id, id);
  if (!deleted) {
    return err('NOT_FOUND', 'Запись не найдена');
  }
  return ok({ id });
}

export async function removeWatchlistForMedia(
  tx: PoolClient,
  userId: number,
  mediaId: number,
): Promise<void> {
  await deleteWatchlistForMediaTx(tx, userId, mediaId);
}
