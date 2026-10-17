import { z } from 'zod';

import { CACHE_CATALOG } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { catalogDetailQuery, resolveDetail } from '@/modules/catalog';

export const dynamic = 'force-dynamic';

export const GET = withRoute(
  {
    operation: 'catalog.detail',
    schema: z.undefined(),
    querySchema: catalogDetailQuery,
    resolveActor: getActor,
    rateLimit: { limit: 120, windowMs: 60_000 },
    headers: { 'cache-control': CACHE_CATALOG },
  },
  async (_input, { query }) => {
    const result = await resolveDetail(query.kind, query.id);
    return result.ok ? ok({ item: result.value }) : result;
  },
);
