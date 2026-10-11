import { z } from 'zod';

import { json } from '@/core/http/responses';
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

  return json({ items: result.value });
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
    return result.ok ? ok({ id: result.value.id }) : result;
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
  async (_input, { actor, query }) => removeWatchlist(actor, query.id),
);
