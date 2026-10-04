import type { ZodType } from 'zod';

import type { Actor } from '@/core/auth/policy';
import { env } from '@/core/config/env';
import { log } from '@/core/log/logger';
import { getRequestId, REQUEST_ID_HEADER } from '@/core/log/request-id';
import type { ErrCode, Result } from '@/core/result';

import { isTrustedOrigin } from './origin';
import { RateLimiter } from './rate-limit';
import { json } from './responses';

const STATUS_BY_CODE: Record<ErrCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export type RouteContext = { actor: Actor; requestId: string };

export type WithRouteConfig<TIn> = {
  operation: string;
  schema: ZodType<TIn>;
  resolveActor?: () => Promise<Actor | null>;
  isTrusted?: (request: Request) => boolean;
  rateLimit?: {
    limit: number;
    windowMs: number;
    key?: (request: Request, actor: Actor) => string;
  };
  maxBodyBytes?: number;
};

export type RouteHandler = (request: Request) => Promise<Response>;

export function withRoute<TIn, TOut>(
  config: WithRouteConfig<TIn>,
  handler: (input: TIn, context: RouteContext) => Promise<Result<TOut>>,
): RouteHandler {
  const limiter = new RateLimiter();
  const maxBodyBytes = config.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;

  return async function route(request: Request): Promise<Response> {
    const requestId = getRequestId(request);
    const responseHeaders = { [REQUEST_ID_HEADER]: requestId };

    const trusted = config.isTrusted
      ? config.isTrusted(request)
      : isTrustedOrigin(request, env.APP_ORIGIN);
    if (!trusted) {
      log('warn', 'mutation.origin_rejected', { requestId, operation: config.operation });
      return json({ error: 'Недопустимый источник' }, 403, responseHeaders);
    }

    const actor = config.resolveActor ? await config.resolveActor() : null;
    if (!actor) {
      log('warn', 'mutation.unauthenticated', { requestId, operation: config.operation });
      return json({ error: 'Требуется вход' }, 401, responseHeaders);
    }

    if (config.rateLimit) {
      const key = config.rateLimit.key
        ? config.rateLimit.key(request, actor)
        : actor.id;
      const allowed = limiter.consume(
        `${config.operation}:${key}`,
        config.rateLimit.limit,
        config.rateLimit.windowMs,
      );
      if (!allowed) {
        log('warn', 'mutation.rate_limited', { requestId, operation: config.operation });
        return json({ error: 'Слишком много запросов' }, 429, responseHeaders);
      }
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    const rawText = await request.text().catch(() => '');
    if (
      (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) ||
      rawText.length > maxBodyBytes
    ) {
      log('info', 'mutation.body_too_large', { requestId, operation: config.operation });
      return json({ error: 'Слишком большой запрос' }, 413, responseHeaders);
    }

    let raw: unknown;
    try {
      raw = rawText.length > 0 ? JSON.parse(rawText) : undefined;
    } catch {
      raw = undefined;
    }

    const parsed = config.schema.safeParse(raw);
    if (!parsed.success) {
      log('info', 'mutation.invalid_input', { requestId, operation: config.operation });
      return json({ error: 'Некорректный запрос' }, 400, responseHeaders);
    }

    try {
      const result = await handler(parsed.data, { actor, requestId });
      if (!result.ok) {
        log('info', 'mutation.rejected', {
          requestId,
          operation: config.operation,
          code: result.code,
        });
        return json(
          { error: result.message, code: result.code },
          STATUS_BY_CODE[result.code],
          responseHeaders,
        );
      }
      return json(result.value, 200, responseHeaders);
    } catch (error) {
      log('error', 'mutation.unexpected', {
        requestId,
        operation: config.operation,
        error: error instanceof Error ? error.message : String(error),
      });
      return json({ error: 'Внутренняя ошибка' }, 500, responseHeaders);
    }
  };
}
