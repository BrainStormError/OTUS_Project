import type { ZodType } from 'zod';

import type { Actor } from '@/core/auth/policy';
import { env } from '@/core/config/env';
import { log } from '@/core/log/logger';
import { getRequestId, REQUEST_ID_HEADER } from '@/core/log/request-id';
import type { ErrCode, Result } from '@/core/result';

import { isTrustedOrigin } from './origin';
import { MemoryRateLimiter, type RateLimiter } from './rate-limit';
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

export type RouteContext<TQuery = undefined> = {
  actor: Actor;
  requestId: string;
  query: TQuery;
};

export type WithRouteConfig<TIn, TQuery = undefined> = {
  operation: string;
  schema: ZodType<TIn>;
  querySchema?: ZodType<TQuery>;
  resolveActor?: () => Promise<Actor | null>;
  isTrusted?: (request: Request) => boolean;
  rateLimit?: {
    limit: number;
    windowMs: number;
    key?: (request: Request, actor: Actor) => string;
  };
  rateLimiter?: RateLimiter;
  maxBodyBytes?: number;
  // Extra headers merged into the success response (for example a cache policy
  // for a read-only endpoint). Error responses keep their own headers.
  headers?: Record<string, string>;
  // Extra input derived from the request URL (for example a path id) that is
  // merged with the parsed body before validation. Lets `withRoute` stay the
  // single reader of the request body.
  pathParams?: (url: URL) => Record<string, unknown>;
};

export type RouteHandler = (request: Request) => Promise<Response>;

// Reads the body as a byte stream and aborts as soon as the cap is exceeded,
// without buffering the whole payload. Returns null when the body is too large.
async function readBodyWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<string | null> {
  const body = request.body;
  if (!body) {
    return '';
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // The stream may already be cancelled; releasing twice is harmless.
    }
  }

  if (total === 0) {
    return '';
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export function withRoute<TIn, TOut, TQuery = undefined>(
  config: WithRouteConfig<TIn, TQuery>,
  handler: (input: TIn, context: RouteContext<TQuery>) => Promise<Result<TOut>>,
): RouteHandler {
  const limiter: RateLimiter = config.rateLimiter ?? new MemoryRateLimiter();
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
      const key = config.rateLimit.key ? config.rateLimit.key(request, actor) : actor.id;
      const allowed = await limiter.consume(
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
    if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
      log('info', 'mutation.body_too_large', { requestId, operation: config.operation });
      return json({ error: 'Слишком большой запрос' }, 413, responseHeaders);
    }

    const rawText = await readBodyWithinLimit(request, maxBodyBytes);
    if (rawText === null) {
      log('info', 'mutation.body_too_large', { requestId, operation: config.operation });
      return json({ error: 'Слишком большой запрос' }, 413, responseHeaders);
    }

    let raw: unknown;
    try {
      raw = rawText.length > 0 ? JSON.parse(rawText) : undefined;
    } catch {
      raw = undefined;
    }

    if (config.pathParams) {
      const base = raw !== null && typeof raw === 'object' ? raw : {};
      raw = { ...base, ...config.pathParams(new URL(request.url)) };
    }

    let query: TQuery | undefined;
    if (config.querySchema) {
      const params = Object.fromEntries(new URL(request.url).searchParams);
      const parsedQuery = config.querySchema.safeParse(params);
      if (!parsedQuery.success) {
        log('info', 'mutation.invalid_input', { requestId, operation: config.operation });
        return json({ error: 'Некорректный запрос' }, 400, responseHeaders);
      }
      query = parsedQuery.data;
    }

    const parsed = config.schema.safeParse(raw);
    if (!parsed.success) {
      log('info', 'mutation.invalid_input', { requestId, operation: config.operation });
      return json({ error: 'Некорректный запрос' }, 400, responseHeaders);
    }

    try {
      const result = await handler(parsed.data, { actor, requestId, query: query as TQuery });
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
      return json(result.value, 200, { ...responseHeaders, ...config.headers });
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
