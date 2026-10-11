import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/auth/session', () => ({
  getActor: async () => ({ id: 999, role: 'employee', email: 'reg@example.com' }),
}));

import { POST as registerPOST } from '@/app/api/auth/register/route';
import { closePool } from '@/core/db/pool';
import { rateLimitByIp } from '@/core/http/rate-limit-guard';

afterAll(async () => {
  await closePool();
});

function uniqueIp(): string {
  return `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
}

describe('auth endpoint rate limiting', () => {
  it('refuses auth handler requests after the allowance for one client IP', async () => {
    const guarded = rateLimitByIp(async () => new Response('ok', { status: 200 }), {
      operation: `auth.test.${randomUUID()}`,
      limit: 3,
      windowMs: 60_000,
    });
    const ip = uniqueIp();

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await guarded(
        new Request('http://localhost:3000/api/auth/session', {
          headers: { 'x-forwarded-for': ip },
        }),
      );
      statuses.push(response.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  it('does not reset the allowance when a client rotates spoofed forwarding headers', async () => {
    const guarded = rateLimitByIp(async () => new Response('ok', { status: 200 }), {
      operation: `auth.test.${randomUUID()}`,
      limit: 3,
      windowMs: 60_000,
    });

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await guarded(
        new Request('http://localhost:3000/api/auth/session', {
          headers: {
            'x-forwarded-for': `spoofed-${attempt}`,
            'x-real-ip': `192.0.2.${attempt + 1}`,
          },
        }),
      );
      statuses.push(response.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  it('refuses registration after the allowance for one client IP', async () => {
    const ip = uniqueIp();
    let limited = false;

    for (let attempt = 0; attempt < 15; attempt += 1) {
      const response = await registerPOST(
        new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'x-forwarded-for': ip,
            origin: 'http://localhost:3000',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ ticket: 'x', email: 'reg@example.com', name: 'Reg' }),
        }),
      );
      if (response.status === 429) {
        limited = true;
        break;
      }
    }

    expect(limited).toBe(true);
  });
});
