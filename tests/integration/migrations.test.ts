import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

import { runMigrations } from '@/core/db/migrate';

const { databaseUrl } = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/integration/.db-url.json'), 'utf8'),
) as { databaseUrl: string };

async function columns(table: string): Promise<string[]> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    return result.rows.map((row) => row.column_name);
  } finally {
    await client.end();
  }
}

async function indexes(table: string): Promise<string[]> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1`,
      [table],
    );
    return result.rows.map((row) => row.indexdef);
  } finally {
    await client.end();
  }
}

async function dataType(table: string, column: string): Promise<string | null> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ data_type: string }>(
      `SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    return result.rows[0]?.data_type ?? null;
  } finally {
    await client.end();
  }
}

describe('users migration', () => {
  it('creates the compact users table with numeric ids and unique indexes', async () => {
    const names = await columns('users');
    expect(names).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'name',
        'handle',
        'role',
        'provider',
        'provider_subject',
        'profile_hidden',
        'stats_hidden',
        'created_at',
        'updated_at',
      ]),
    );
    expect(await dataType('users', 'id')).toBe('bigint');
    expect(await dataType('users', 'role')).toBe('smallint');

    const indexDefs = await indexes('users');
    expect(indexDefs.some((def) => def.includes('users_email_key'))).toBe(true);
    expect(indexDefs.some((def) => def.includes('users_handle_key'))).toBe(true);
    expect(indexDefs.some((def) => def.includes('users_provider_subject_key'))).toBe(true);
  });

  it('does not install the pgcrypto extension and drops the old tables', async () => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const extension = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM pg_extension WHERE extname = 'pgcrypto'`,
      );
      expect(extension.rows[0]?.count).toBe('0');
      expect(await tableExists(databaseUrl, 'watched_records')).toBe(false);
      expect(await tableExists(databaseUrl, 'group_ratings')).toBe(false);
      expect(await tableExists(databaseUrl, 'directory_entries')).toBe(false);
    } finally {
      await client.end();
    }
  });
});

describe('compact domain migrations', () => {
  it('creates media with a unique business key and genre codes', async () => {
    const names = await columns('media');
    expect(names).toEqual(
      expect.arrayContaining(['id', 'kind', 'external_ref', 'title', 'year', 'genre_ids']),
    );
    const indexDefs = await indexes('media');
    expect(indexDefs.some((def) => def.includes('media_kind_ref_key') && def.includes('UNIQUE'))).toBe(
      true,
    );
    expect(await columns('genres')).toEqual(expect.arrayContaining(['id', 'name']));
  });

  it('creates the unified ratings table with partial unique indexes', async () => {
    const names = await columns('ratings');
    expect(names).toEqual(
      expect.arrayContaining([
        'id',
        'user_id',
        'media_id',
        'group_id',
        'rating',
        'comment',
        'watched_at',
        'created_at',
      ]),
    );
    expect(await dataType('ratings', 'rating')).toBe('smallint');

    const indexDefs = await indexes('ratings');
    const personal = indexDefs.find((def) => def.includes('ratings_personal_key'));
    expect(personal).toContain('UNIQUE');
    expect(personal).toContain('WHERE (group_id IS NULL)');
    const group = indexDefs.find((def) => def.includes('ratings_group_key'));
    expect(group).toContain('UNIQUE');
    expect(group).toContain('WHERE (group_id IS NOT NULL)');
  });

  it('creates groups with tag codes and a media partial unique index on discussions', async () => {
    expect(await columns('groups')).toEqual(
      expect.arrayContaining(['id', 'name', 'description', 'tag_ids', 'restricted', 'created_at']),
    );
    expect(await columns('tags')).toEqual(expect.arrayContaining(['id', 'name']));

    expect(await columns('group_discussions')).toEqual(
      expect.arrayContaining(['id', 'group_id', 'author_id', 'title', 'media_id', 'created_at']),
    );
    const discussionIndexes = await indexes('group_discussions');
    const mediaIndex = discussionIndexes.find((def) =>
      def.includes('group_discussions_media_key'),
    );
    expect(mediaIndex).toContain('UNIQUE');
    expect(mediaIndex).toContain('WHERE (media_id IS NOT NULL)');
  });

  it('makes names case-insensitively unique and adds group invitations', async () => {
    const groupIndexes = await indexes('groups');
    const groupName = groupIndexes.find((def) => def.includes('groups_name_key'));
    expect(groupName).toContain('UNIQUE');
    expect(groupName).toMatch(/lower\(\(name\)/i);

    const tagIndexes = await indexes('tags');
    const tagName = tagIndexes.find((def) => def.includes('tags_name_lower_key'));
    expect(tagName).toContain('UNIQUE');
    expect(tagName).toMatch(/lower\(\(name\)/i);
    expect(tagIndexes.some((def) => def.includes('tags_name_key'))).toBe(false);

    expect(await columns('group_invitations')).toEqual(
      expect.arrayContaining([
        'id',
        'group_id',
        'inviter_id',
        'invitee_id',
        'status',
        'created_at',
        'updated_at',
      ]),
    );
    expect(await dataType('group_invitations', 'id')).toBe('bigint');
    expect(await dataType('group_invitations', 'status')).toBe('smallint');
    const invitationIndexes = await indexes('group_invitations');
    expect(
      invitationIndexes.some(
        (def) => def.includes('group_invitations_group_invitee_key') && def.includes('UNIQUE'),
      ),
    ).toBe(true);
  });

  it('creates discussion posts, friendships and activity events without a payload', async () => {
    expect(await columns('discussion_posts')).toEqual(
      expect.arrayContaining(['id', 'discussion_id', 'author_id', 'body', 'created_at']),
    );
    expect(await columns('friendships')).toEqual(
      expect.arrayContaining(['id', 'requester_id', 'addressee_id', 'status', 'created_at', 'updated_at']),
    );
    expect(await columns('activity_events')).toEqual(
      expect.arrayContaining([
        'id',
        'actor_id',
        'kind',
        'group_id',
        'media_id',
        'discussion_id',
        'created_at',
      ]),
    );
    expect(await columns('activity_events')).not.toContain('payload');
    expect(await columns('activity_events')).not.toContain('target_type');
    expect(await dataType('activity_events', 'kind')).toBe('smallint');
  });

  it('reverses every migration on a dedicated database', async () => {
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
      for (const table of [
        'users',
        'media',
        'genres',
        'ratings',
        'friendships',
        'groups',
        'group_members',
        'tags',
        'group_invitations',
        'group_discussions',
        'discussion_posts',
        'activity_events',
      ]) {
        expect(await tableExists(target.toString(), table), table).toBe(true);
      }

      while ((await countMigrations(target.toString())) > 0) {
        await runMigrations('down', target.toString());
      }

      for (const table of [
        'activity_events',
        'discussion_posts',
        'group_discussions',
        'group_invitations',
        'group_members',
        'groups',
        'tags',
        'friendships',
        'ratings',
        'media',
        'genres',
        'users',
      ]) {
        expect(await tableExists(target.toString(), table), table).toBe(false);
      }
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
