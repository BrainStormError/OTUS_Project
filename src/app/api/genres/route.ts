import { z } from 'zod';

import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { listGenres } from '@/modules/catalog';

export const dynamic = 'force-dynamic';

export const GET = withRoute(
  {
    operation: 'catalog.genres',
    schema: z.undefined(),
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async () => {
    const result = await listGenres();
    return result.ok ? ok({ items: result.value }) : result;
  },
);
