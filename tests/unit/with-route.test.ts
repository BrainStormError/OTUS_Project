import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { Actor } from '@/core/auth/policy';
import { withRoute, type WithRouteConfig } from '@/core/http/with-route';
import { err, ok } from '@/core/result';

const schema = z.object({ name: z.string().min(1).max(5) });
const actor: Actor = { id: 1, role: 'employee' };

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function build(
  config: Partial<WithRouteConfig<z.infer<typeof schema>>>,
  handler: Parameters<typeof withRoute<z.infer<typeof schema>, unknown>>[1],
) {
  return withRoute<z.infer<typeof schema>, unknown>(
    {
      operation: 'test.create',
      schema,
      resolveActor: async () => actor,
      isTrusted: () => true,
      ...config,
    },
    handler,
  );
}

describe('withRoute', () => {
  it('returns 403 for an untrusted origin', async () => {
    const route = build({ isTrusted: () => false }, async () => ok({}));
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(403);
  });

  it('returns 401 when there is no actor', async () => {
    const route = build({ resolveActor: async () => null }, async () => ok({}));
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(401);
  });

  it('answers 401 for a read without an actor before the origin check', async () => {
    const route = build(
      { resolveActor: async () => null, isTrusted: () => false },
      async () => ok({}),
    );
    const response = await route(
      new Request('http://localhost/api/test', { method: 'GET' }),
    );
    expect(response.status).toBe(401);
  });

  it('rejects an untrusted mutation before checking the actor', async () => {
    const route = build(
      { resolveActor: async () => null, isTrusted: () => false },
      async () => ok({}),
    );
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid input', async () => {
    const route = build({}, async () => ok({}));
    const response = await route(request({ name: 'too-long' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 for an unparseable body', async () => {
    const route = build({}, async () => ok({}));
    const response = await route(request('{not json'));
    expect(response.status).toBe(400);
  });

  it('maps a typed failure to its status', async () => {
    const route = build({}, async () => err('FORBIDDEN', 'no'));
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('returns 200 and the request id on success', async () => {
    const route = build({}, async (input) => ok({ created: input.name }));
    const response = await route(request({ name: 'ok' }, { 'x-request-id': 'req-9' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('req-9');
    expect(await response.json()).toEqual({ created: 'ok' });
  });

  it('returns 500 and hides details when the handler throws', async () => {
    const route = build({}, async () => {
      throw new Error('db exploded');
    });
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('db exploded');
  });

  it('returns 429 once the rate limit is exceeded', async () => {
    const route = build({ rateLimit: { limit: 2, windowMs: 60_000 } }, async () => ok({}));
    expect((await route(request({ name: 'a' }))).status).toBe(200);
    expect((await route(request({ name: 'b' }))).status).toBe(200);
    expect((await route(request({ name: 'c' }))).status).toBe(429);
  });

  it('returns 413 when the declared body exceeds the cap', async () => {
    const route = build({ maxBodyBytes: 5 }, async () => ok({}));
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(413);
  });

  it('rejects an oversized chunked body without a content-length', async () => {
    const route = build({ maxBodyBytes: 16 }, async () => ok({}));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('x'.repeat(64)));
        controller.close();
      },
    });
    const response = await route(
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: stream,
        // @ts-expect-error Node's fetch requires half-duplex for stream bodies.
        duplex: 'half',
      }),
    );
    expect(response.status).toBe(413);
  });

  it('processes a body within the cap', async () => {
    const route = build({ maxBodyBytes: 1024 }, async () => ok({ name: 'ok' }));
    const response = await route(request({ name: 'ok' }));
    expect(response.status).toBe(200);
  });
});
