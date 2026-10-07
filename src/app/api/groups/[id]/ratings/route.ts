import { parsePositiveInt } from '@/core/http/params';
import { json } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { groupRatingInput, saveGroupRating } from '@/modules/groups';

const save = withRoute(
  {
    operation: 'groups.ratings.save',
    schema: groupRatingInput,
    resolveActor: getActor,
    rateLimit: { limit: 60, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await saveGroupRating(actor, input);
    return result.ok ? ok({ userId: result.value.userId }) : result;
  },
);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const groupId = parsePositiveInt(id);
  if (groupId === null) {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const payload = typeof body === 'object' && body !== null ? body : {};
  return save(
    new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ ...payload, groupId }),
    }),
  );
}
