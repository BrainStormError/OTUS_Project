import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR, json } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import {
  deleteWatchedRecord,
  listWatchedRecords,
  saveWatchedRecord,
  upsertWatchedRecordInput,
} from '@/modules/records';

export const dynamic = 'force-dynamic';

const deleteRecordQuery = z.object({
  id: z.coerce.number().int().positive(),
});

export async function GET(): Promise<Response> {
  const actor = await getActor();
  if (!actor) {
    return json({ error: 'Требуется вход' }, 401);
  }

  const result = await listWatchedRecords(actor);
  if (!result.ok) {
    return json({ error: result.message, code: result.code }, 400);
  }

  return json({ items: result.value }, 200, { 'cache-control': CACHE_SINGLE_AUTHOR });
}

export const POST = withRoute(
  {
    operation: 'records.upsert',
    schema: upsertWatchedRecordInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await saveWatchedRecord(actor, input);
    if (!result.ok) {
      return result;
    }
    return ok({ id: result.value.id });
  },
);

export const DELETE = withRoute(
  {
    operation: 'records.delete',
    schema: z.undefined(),
    querySchema: deleteRecordQuery,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (_input, { actor, query }) => {
    const result = await deleteWatchedRecord(actor, query.id);
    if (!result.ok) {
      return result;
    }
    return result;
  },
);
