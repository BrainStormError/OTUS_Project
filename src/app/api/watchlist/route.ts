import { z } from 'zod';

import { CACHE_SINGLE_AUTHOR, json } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { mediaKinds } from '@/modules/ratings';
import {
  addWatchlist,
  addWatchlistInput,
  listWatchlist,
  removeWatchlist,
} from '@/modules/watchlist';

export const dynamic = 'force-dynamic';

const listQuery = z.object({
  kind: z.enum(mediaKinds),
});

const deleteQuery = z.object({
  id: z.coerce.number().int().positive(),
});

export async function GET(request: Request): Promise<Response> {
  const actor = await getActor();
  if (!actor) {
    return json({ error: 'Требуется вход' }, 401);
  }

  const parsed = listQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return json({ error: 'Некорректный запрос' }, 400);
  }

  const result = await listWatchlist(actor, parsed.data.kind);
  if (!result.ok) {
    return json({ error: result.message, code: result.code }, 400);
  }

  return json({ items: result.value }, 200, { 'cache-control': CACHE_SINGLE_AUTHOR });
}

export const POST = withRoute(
  {
    operation: 'watchlist.add',
    schema: addWatchlistInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await addWatchlist(actor, input);
    if (!result.ok) {
      return result;
    }
    return ok({ id: result.value.id });
  },
);

export const DELETE = withRoute(
  {
    operation: 'watchlist.delete',
    schema: z.undefined(),
    querySchema: deleteQuery,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (_input, { actor, query }) => {
    const result = await removeWatchlist(actor, query.id);
    if (!result.ok) {
      return result;
    }
    return result;
  },
);
