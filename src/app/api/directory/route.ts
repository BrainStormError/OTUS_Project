import { ok } from '@/core/result';
import { createDirectoryEntry } from '@/modules/directory';
import { getActor } from '@/modules/auth/session';

import { createDirectoryPostRoute } from './route-factory';

export const POST = createDirectoryPostRoute({
  resolveActor: getActor,
  create: async (actor, input) => {
    const result = await createDirectoryEntry(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
});
