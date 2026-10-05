import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

import { runMigrations } from '@/core/db/migrate';

const { databaseUrl } = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/integration/.db-url.json'), 'utf8'),
) as { databaseUrl: string };

describe('initial migration', () => {
  it('creates the users table with the expected columns and unique indexes', async () => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const columns = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'`,
      );
      const names = columns.rows.map((row) => row.column_name);
      expect(names).toEqual(
        expect.arrayContaining([
          'id',
          'email',
          'name',
          'role',
          'provider',
          'provider_subject',
          'created_at',
          'updated_at',
        ]),
      );

      const indexes = await client.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = 'users'`,
      );
      const indexNames = indexes.rows.map((row) => row.indexname);
      expect(indexNames).toContain('users_email_key');
      expect(indexNames).toContain('users_provider_subject_key');
    } finally {
      await client.end();
    }
  });

  it('reverses the up migration on a dedicated database', async () => {
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = '/postgres';
    const admin = new Client({ connectionString: adminUrl.toString() });
    await admin.connect();

    const dbName = `migrate_verify_${Date.now()}`;
    try {
      await admin.query(`CREATE DATABASE ${dbName}`);
      const target = new URL(databaseUrl);
      target.pathname = `/${dbName}`;

      await runMigrations('up', target.toString());
      expect(await tableExists(target.toString(), 'users')).toBe(true);
      expect(await tableExists(target.toString(), 'directory_entries')).toBe(true);
      expect(await tableExists(target.toString(), 'activity_events')).toBe(true);

      while ((await countMigrations(target.toString())) > 0) {
        await runMigrations('down', target.toString());
      }

      expect(await tableExists(target.toString(), 'activity_events')).toBe(false);
      expect(await tableExists(target.toString(), 'directory_entries')).toBe(false);
      expect(await tableExists(target.toString(), 'users')).toBe(false);
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await admin.end();
    }
  });
});

async function tableExists(connectionString: string, table: string): Promise<boolean> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
       ) AS exists`,
      [table],
    );
    return result.rows[0]?.exists === true;
  } finally {
    await client.end();
  }
}

async function countMigrations(connectionString: string): Promise<number> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM pgmigrations`,
    );
    return Number(result.rows[0]?.count ?? '0');
  } finally {
    await client.end();
  }
}
