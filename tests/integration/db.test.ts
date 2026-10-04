import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { closePool, getPool, query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';

afterAll(async () => {
  await closePool();
});

describe('shared pool', () => {
  it('returns the same pool instance and executes a query', async () => {
    const first = getPool();
    const second = getPool();
    expect(first).toBe(second);

    const rows = await query<{ value: number }>('SELECT 1 AS value');
    expect(rows[0]?.value).toBe(1);
  });
});

describe('withTransaction', () => {
  it('commits when the callback succeeds', async () => {
    const email = `${randomUUID()}@example.com`;
    await withTransaction(async (tx) => {
      await tx.query('INSERT INTO users (email, role) VALUES ($1, $2)', [email, 'employee']);
    });

    const rows = await query<{ email: string }>(
      'SELECT email FROM users WHERE email = $1',
      [email],
    );
    expect(rows).toHaveLength(1);
  });

  it('rolls back every statement when the callback fails', async () => {
    const email = `${randomUUID()}@example.com`;
    await expect(
      withTransaction(async (tx) => {
        await tx.query('INSERT INTO users (email, role) VALUES ($1, $2)', [email, 'employee']);
        throw new Error('boom');
      }),
    ).rejects.toThrowError('boom');

    const rows = await query<{ email: string }>(
      'SELECT email FROM users WHERE email = $1',
      [email],
    );
    expect(rows).toHaveLength(0);
  });
});
