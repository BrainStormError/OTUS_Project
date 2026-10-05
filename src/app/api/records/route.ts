import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { saveWatchedRecord, upsertWatchedRecordInput } from '@/modules/records';

export const POST = withRoute(
  {
    operation: 'records.upsert',
    schema: upsertWatchedRecordInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await saveWatchedRecord(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);
