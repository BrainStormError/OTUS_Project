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
    expect(await columns('film_genres')).toEqual(expect.arrayContaining(['id', 'name']));
    expect(await columns('series_genres')).toEqual(expect.arrayContaining(['id', 'name']));

    const filmIndexes = await indexes('film_genres');
    expect(
      filmIndexes.some((def) => def.includes('film_genres_name_key') && def.includes('UNIQUE')),
    ).toBe(true);
    const seriesIndexes = await indexes('series_genres');
    expect(
      seriesIndexes.some((def) => def.includes('series_genres_name_key') && def.includes('UNIQUE')),
    ).toBe(true);

    expect(await tableExists(databaseUrl, 'genres')).toBe(false);
    expect(await tableExists(databaseUrl, 'genre_kinds')).toBe(false);
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

  it('adds invalidation signals with a per-recipient target and a partial index', async () => {
    expect(await columns('activity_events')).toEqual(expect.arrayContaining(['target_user_id']));
    expect(await dataType('activity_events', 'target_user_id')).toBe('bigint');

    const indexDefs = await indexes('activity_events');
    expect(
      indexDefs.some((def) => def.includes('activity_events_target_idx') && def.includes('WHERE')),
    ).toBe(true);

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const constraint = await client.query<{ def: string }>(
        `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
          WHERE conrelid = 'activity_events'::regclass AND conname = 'activity_events_kind_check'`,
      );
      expect(constraint.rows[0]?.def ?? '').toContain('6');
      expect(constraint.rows[0]?.def ?? '').toContain('9');
    } finally {
      await client.end();
    }
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
        'film_genres',
        'series_genres',
        'ratings',
        'friendships',
        'groups',
        'group_members',
        'tags',
        'group_invitations',
        'group_discussions',
        'discussion_posts',
        'activity_events',
        'watchlist',
        'tmdb_cache',
      ]) {
        expect(await tableExists(target.toString(), table), table).toBe(true);
      }

      while ((await countMigrations(target.toString())) > 0) {
        await runMigrations('down', target.toString());
      }

      for (const table of [
        'tmdb_cache',
        'watchlist',
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
        'film_genres',
        'series_genres',
        'genres',
        'genre_kinds',
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

describe('genre catalog split migration', () => {
  const MIGRATION_FILE = resolve(
    process.cwd(),
    'src/core/db/migrations/1710000000019_split_genre_catalogs.sql',
  );

  function migrationParts(): { up: string; down: string } {
    const source = readFileSync(MIGRATION_FILE, 'utf8');
    const [up = '', down = ''] = source.split('-- Down Migration');
    return { up: up.replace('-- Up Migration', ''), down };
  }

  async function withFreshDatabase(
    run: (connectionString: string) => Promise<void>,
  ): Promise<void> {
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = '/postgres';
    const admin = new Client({ connectionString: adminUrl.toString() });
    await admin.connect();

    const dbName = `genre_split_${Date.now()}`;
    try {
      await admin.query(`CREATE DATABASE ${dbName}`);
      const target = new URL(databaseUrl);
      target.pathname = `/${dbName}`;
      await run(target.toString());
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await admin.end();
    }
  }

  it('copies each kind into its own table and drops the merged schema', async () => {
    const { up } = migrationParts();
    await withFreshDatabase(async (connectionString) => {
      const client = new Client({ connectionString });
      await client.connect();
      try {
        await client.query(`
          CREATE TABLE genres (id smallint PRIMARY KEY, name varchar(80) NOT NULL);
          CREATE UNIQUE INDEX genres_name_key ON genres (name);
          CREATE TABLE genre_kinds (
            genre_id  smallint NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
            kind      smallint NOT NULL CHECK (kind IN (0, 1)),
            PRIMARY KEY (genre_id, kind)
          );
          INSERT INTO genres (id, name) VALUES
            (14, 'Фэнтези'), (18, 'Драма'), (10765, 'Научная фантастика и фэнтези');
          INSERT INTO genre_kinds (genre_id, kind) VALUES
            (14, 0), (18, 0), (18, 1), (10765, 1);
        `);

        await client.query(up);

        const film = await client.query<{ id: number; name: string }>(
          'SELECT id, name FROM film_genres ORDER BY id',
        );
        const series = await client.query<{ id: number; name: string }>(
          'SELECT id, name FROM series_genres ORDER BY id',
        );
        expect(film.rows).toEqual([
          { id: 14, name: 'Фэнтези' },
          { id: 18, name: 'Драма' },
        ]);
        expect(series.rows).toEqual([
          { id: 18, name: 'Драма' },
          { id: 10765, name: 'Научная фантастика и фэнтези' },
        ]);

        const dropped = await client.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name IN ('genres', 'genre_kinds')`,
        );
        expect(dropped.rows[0]?.count).toBe('0');
      } finally {
        await client.end();
      }
    });
  });

  it('rebuilds the merged schema from the per-kind tables on rollback', async () => {
    const { up, down } = migrationParts();
    await withFreshDatabase(async (connectionString) => {
      const client = new Client({ connectionString });
      await client.connect();
      try {
        await client.query(`
          CREATE TABLE genres (id smallint PRIMARY KEY, name varchar(80) NOT NULL);
          CREATE UNIQUE INDEX genres_name_key ON genres (name);
          CREATE TABLE genre_kinds (
            genre_id  smallint NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
            kind      smallint NOT NULL CHECK (kind IN (0, 1)),
            PRIMARY KEY (genre_id, kind)
          );
          INSERT INTO genres (id, name) VALUES (18, 'Драма'), (10765, 'Фантастика');
          INSERT INTO genre_kinds (genre_id, kind) VALUES (18, 0), (18, 1), (10765, 1);
        `);
        await client.query(up);
        await client.query(down);

        const merged = await client.query<{ id: number; name: string }>(
          'SELECT id, name FROM genres ORDER BY id',
        );
        expect(merged.rows).toEqual([
          { id: 18, name: 'Драма' },
          { id: 10765, name: 'Фантастика' },
        ]);
        const kinds = await client.query<{ genre_id: number; kind: number }>(
          'SELECT genre_id, kind FROM genre_kinds ORDER BY genre_id, kind',
        );
        expect(kinds.rows).toEqual([
          { genre_id: 18, kind: 0 },
          { genre_id: 18, kind: 1 },
          { genre_id: 10765, kind: 1 },
        ]);
      } finally {
        await client.end();
      }
    });
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
