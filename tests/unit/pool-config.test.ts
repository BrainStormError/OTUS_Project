import { afterAll, describe, expect, it } from 'vitest';

import { closePool, getPool } from '@/core/db/pool';

afterAll(async () => {
  await closePool();
});

describe('connection pool configuration', () => {
  it('keeps connections established by sizing min to max', () => {
    const { options } = getPool();
    expect(options.max).toBe(10);
    expect(options.min).toBe(10);
  });

  it('waits up to 10 seconds for a pooled connection', () => {
    expect(getPool().options.connectionTimeoutMillis).toBe(10_000);
  });
});
