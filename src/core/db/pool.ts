import { Pool, types } from 'pg';

import { env } from '@/core/config/env';

// bigint (int8, OID 20) is returned as a string by node-postgres. Identity
// keys in the compact schema are bigint, so parse them as numbers everywhere.
types.setTypeParser(20, (value: string) => Number(value));

const globalForPool = globalThis as unknown as { __watcherPool?: Pool };

export function getPool(): Pool {
  if (!globalForPool.__watcherPool) {
    globalForPool.__watcherPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return globalForPool.__watcherPool;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(text, params as unknown[]);
  return result.rows as T[];
}

export async function pingDatabase(): Promise<void> {
  await getPool().query('SELECT 1');
}

export async function closePool(): Promise<void> {
  if (globalForPool.__watcherPool) {
    await globalForPool.__watcherPool.end();
    globalForPool.__watcherPool = undefined;
  }
}
