import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { closePool } from '@/core/db/pool';
import { PostgresRateLimiter } from '@/core/http/rate-limit';

afterAll(async () => {
  await closePool();
});

describe('PostgresRateLimiter', () => {
  it('counts concurrent requests for the same key against one limit', async () => {
    const limiter = new PostgresRateLimiter();
    const key = `rate:${randomUUID()}`;

    const results = await Promise.all(
      Array.from({ length: 10 }, () => limiter.consume(key, 3, 60_000)),
    );

    expect(results.filter(Boolean)).toHaveLength(3);
  });

  it('tracks keys independently and can be reset', async () => {
    const limiter = new PostgresRateLimiter();
    const keyA = `rate:${randomUUID()}`;
    const keyB = `rate:${randomUUID()}`;

    expect(await limiter.consume(keyA, 1, 60_000)).toBe(true);
    expect(await limiter.consume(keyA, 1, 60_000)).toBe(false);
    expect(await limiter.consume(keyB, 1, 60_000)).toBe(true);

    await limiter.reset();
    expect(await limiter.consume(keyA, 1, 60_000)).toBe(true);
  });
});
