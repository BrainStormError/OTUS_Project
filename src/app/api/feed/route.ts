import { toFeedEvent } from '@/components/features/movie-tracker/feed';
import { CACHE_LIVE_FEED, json } from '@/core/http/responses';
import { listFeed, listFeedInput } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const actor = await getActor();
  if (!actor) {
    return json({ error: 'Требуется вход' }, 401);
  }

  const params = new URL(request.url).searchParams;
  const parsed = listFeedInput.safeParse({
    limit: params.get('limit') ?? undefined,
    cursor: params.get('cursor') ?? undefined,
    since: params.get('since') ?? undefined,
  });
  if (!parsed.success) {
    return json({ error: 'Некорректный запрос' }, 400);
  }

  const result = await listFeed(actor, parsed.data);
  if (!result.ok) {
    return json({ error: result.message, code: result.code }, 400);
  }

  return json(
    {
      items: result.value.items.map((item) => toFeedEvent(item, actor.id)),
      nextCursor: result.value.nextCursor,
    },
    200,
    { 'cache-control': CACHE_LIVE_FEED },
  );
}
