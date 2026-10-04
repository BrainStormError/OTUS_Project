import { afterAll, describe, expect, it } from 'vitest';

import { closePool, pingDatabase } from '@/core/db/pool';
import { createHealthHandler } from '@/app/api/health/health-factory';

afterAll(async () => {
  await closePool();
});

describe('health endpoint', () => {
  it('returns 200 ok when the database is reachable', async () => {
    const handler = createHealthHandler(pingDatabase);
    const response = await handler();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('returns 503 unavailable when the database ping fails or times out', async () => {
    const handler = createHealthHandler(
      () => new Promise<void>(() => undefined),
      20,
    );
    const response = await handler();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unavailable' });
  });
});
