import { log } from '@/core/log/logger';

import { getClientIp } from './client-ip';
import { getSharedRateLimiter } from './rate-limit';
import { json } from './responses';

// Wraps a request handler with the shared, IP-keyed limiter. Used by the auth
// handler and reusable by any endpoint that must be throttled by client
// identity before the session is known.
export function rateLimitByIp(
  handler: (request: Request) => Promise<Response>,
  options: { operation: string; limit: number; windowMs: number },
): (request: Request) => Promise<Response> {
  const limiter = getSharedRateLimiter();
  return async function guarded(request: Request): Promise<Response> {
    const ip = getClientIp(request);
    const allowed = await limiter.consume(
      `${options.operation}:${ip}`,
      options.limit,
      options.windowMs,
    );
    if (!allowed) {
      log('warn', 'auth.rate_limited', { operation: options.operation, ip });
      return json({ error: 'Слишком много запросов' }, 429);
    }
    return handler(request);
  };
}
