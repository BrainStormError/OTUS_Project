import { parsePositiveInt } from '@/core/http/params';
import { json } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { attachDiscussion, attachDiscussionInput } from '@/modules/discussions';

const attach = withRoute(
  {
    operation: 'groups.ratings.attach',
    schema: attachDiscussionInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await attachDiscussion(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; media: string }> },
): Promise<Response> {
  const { id, media } = await context.params;
  const groupId = parsePositiveInt(id);
  const mediaId = parsePositiveInt(media);
  if (groupId === null || mediaId === null) {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const payload = typeof body === 'object' && body !== null ? body : {};
  return attach(
    new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ ...payload, groupId, mediaId }),
    }),
  );
}
