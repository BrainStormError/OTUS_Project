import { resolve } from 'node:path';

import { runner } from 'node-pg-migrate';

import { getEnv } from '@/core/config/env';

export type MigrationDirection = 'up' | 'down';

export async function runMigrations(
  direction: MigrationDirection,
  databaseUrl?: string,
) {
  const url = databaseUrl ?? getEnv().DATABASE_URL;
  return runner({
    databaseUrl: url,
    dir: resolve(process.cwd(), 'src/core/db/migrations'),
    direction,
    migrationsTable: 'pgmigrations',
    count: direction === 'up' ? Infinity : 1,
  });
}
