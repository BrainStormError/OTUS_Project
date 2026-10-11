import { z } from 'zod';

import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { catalogGenresQuery, listGenres } from '@/modules/catalog';

export const dynamic = 'force-dynamic';

export const GET = withRoute(
  {
    operation: 'catalog.genres',
    schema: z.undefined(),
    querySchema: catalogGenresQuery,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (_input, { query }) => {
    const result = await listGenres(query.kind);
    return result.ok ? ok({ items: result.value }) : result;
  },
);
