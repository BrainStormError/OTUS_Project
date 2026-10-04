import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import { encodeCursor } from './domain';
import type { DirectoryCursor, DirectoryEntry, ListDirectoryResult } from './types';

type EntryRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: Date;
};

const COLUMNS = 'id, name, description, owner_id, created_at';

function mapEntry(row: EntryRow): DirectoryEntry {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listEntries(params: {
  limit: number;
  cursor: DirectoryCursor | null;
}): Promise<ListDirectoryResult> {
  const { limit, cursor } = params;
  const rows = await query<EntryRow>(
    `SELECT ${COLUMNS}
       FROM directory_entries
      WHERE ($1::timestamptz IS NULL OR (created_at, id) < ($1::timestamptz, $2::uuid))
      ORDER BY created_at DESC, id DESC
      LIMIT $3`,
    [cursor?.createdAt ?? null, cursor?.id ?? null, limit + 1],
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map(mapEntry);
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function insertEntry(
  tx: PoolClient,
  input: { name: string; description?: string; ownerId: string },
): Promise<DirectoryEntry> {
  const result = await tx.query<EntryRow>(
    `INSERT INTO directory_entries (name, description, owner_id)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [input.name, input.description ?? null, input.ownerId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('insertEntry returned no row');
  }
  return mapEntry(row);
}
