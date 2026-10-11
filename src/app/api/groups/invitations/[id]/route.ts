import { parsePositiveInt } from '@/core/http/params';
import { withRoute } from '@/core/http/with-route';
import { ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import {
  cancelInvitation,
  invitationIdInput,
  respondInvitation,
  respondInvitationInput,
} from '@/modules/groups';

export const POST = withRoute(
  {
    operation: 'groups.invitations.respond',
    schema: respondInvitationInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ invitationId: parsePositiveInt(url.pathname.split('/')[4]) }),
  },
  async (input, { actor }) => {
    const result = await respondInvitation(actor, input);
    return result.ok ? ok({ id: result.value.id }) : result;
  },
);

export const DELETE = withRoute(
  {
    operation: 'groups.invitations.cancel',
    schema: invitationIdInput,
    resolveActor: getActor,
    rateLimit: { limit: 30, windowMs: 60_000 },
    pathParams: (url) => ({ invitationId: parsePositiveInt(url.pathname.split('/')[4]) }),
  },
  async (input, { actor }) => {
    const result = await cancelInvitation(actor, input);
    return result.ok ? ok({ ok: true }) : result;
  },
);
