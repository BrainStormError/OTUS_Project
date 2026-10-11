import { getClientIp } from '@/core/http/client-ip';
import { getSharedRateLimiter } from '@/core/http/rate-limit';
import { withRoute } from '@/core/http/with-route';
import { err, ok } from '@/core/result';
import { getActor } from '@/modules/auth/session';
import { registerInput } from '@/modules/auth/schema';
import { verifyTicket } from '@/modules/auth/ticket';
import { findUserByEmail, insertUser } from '@/modules/auth/repository';

export const POST = withRoute(
  {
    operation: 'auth.register',
    schema: registerInput,
    resolveActor: getActor,
    rateLimiter: getSharedRateLimiter(),
    rateLimit: { limit: 10, windowMs: 60_000, key: (request) => getClientIp(request) },
  },
  async (input, { actor }) => {
    if (actor.email && actor.email.toLowerCase() !== input.email.toLowerCase()) {
      return err('FORBIDDEN', 'Email не совпадает с текущей сессией');
    }

    const verified = verifyTicket(input.ticket, input.email);
    if (!verified.ok) {
      return verified;
    }

    const existing = await findUserByEmail(input.email);
    if (existing) {
      return err('CONFLICT', 'Пользователь уже зарегистрирован');
    }

    const user = await insertUser({
      email: input.email,
      name: input.name,
      role: 'employee',
      provider: 'ticket',
    });

    return ok({ id: user.id, email: user.email });
  },
);
