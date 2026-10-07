import { parsePositiveInt } from '@/core/http/params';
import { json } from '@/core/http/responses';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { friendshipDecisionInput, withdrawFriendRequest } from '@/modules/friendships';

const withdraw = withRoute(
  {
    operation: 'friendships.withdraw',
    schema: friendshipDecisionInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
  },
  async (input, { actor }) => {
    const result = await withdrawFriendRequest(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const friendshipId = parsePositiveInt(id);
  if (friendshipId === null) {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
  return withdraw(
    new Request(request.url, {
      method: 'DELETE',
      headers: request.headers,
      body: JSON.stringify({ friendshipId }),
    }),
  );
}
