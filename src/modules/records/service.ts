import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';

import { upsertWatchedRecord } from './repository';
import type { UpsertWatchedRecordInput } from './schema';
import type { WatchedRecordEntry } from './types';

export async function saveWatchedRecord(
  actor: Actor,
  input: UpsertWatchedRecordInput,
): Promise<Result<WatchedRecordEntry>> {
  return withTransaction(async (tx) => {
    const record = await upsertWatchedRecord(tx, actor.id, input);
    await recordEvent(tx, {
      actorId: actor.id,
      kind: input.mediaKind === 'film' ? 'film_rated' : 'series_rated',
      targetType: input.mediaKind,
      targetId: input.mediaRef,
      payload: {
        title: input.title,
        rating: input.rating,
        year: input.year,
        href: input.mediaKind === 'film' ? `/film/${input.mediaRef}` : '/series',
      },
    });
    return ok(record);
  });
}
