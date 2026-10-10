import { rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PostgreSqlContainer } from '@testcontainers/postgresql';

import { runMigrations } from '../../src/core/db/migrate';

const URL_FILE = resolve(process.cwd(), 'tests/integration/.db-url.json');

export default async function setup() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('watcher_test')
    .start();

  const databaseUrl = container.getConnectionUri();
  await runMigrations('up', databaseUrl);

  writeFileSync(URL_FILE, JSON.stringify({ databaseUrl, containerId: container.getId() }));

  return async () => {
    await container.stop();
    rmSync(URL_FILE, { force: true });
  };
}
