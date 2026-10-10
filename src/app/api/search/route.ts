import { z } from 'zod';

import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { catalogSearchQuery, searchCatalog } from '@/modules/catalog';

export const dynamic = 'force-dynamic';

export const GET = withRoute(
  {
    operation: 'catalog.search',
    schema: z.undefined(),
    querySchema: catalogSearchQuery,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (_input, { query }) => {
    const genreIds = query.genre
      ? query.genre
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isInteger(value))
      : undefined;

    const result = await searchCatalog({
      kind: query.kind,
      title: query.q,
      genreIds,
      year: query.year,
    });
    return result.ok ? ok({ items: result.value }) : result;
  },
);
