import type { Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { decodeCursor } from './domain';
import { canCreateEntry } from './policy';
import { insertEntry, listEntries } from './repository';
import type { CreateEntryInput, ListDirectoryInput } from './schema';
import type { DirectoryEntry, ListDirectoryResult } from './types';

export async function listDirectory(
  input: ListDirectoryInput,
): Promise<Result<ListDirectoryResult>> {
  let cursor = null;
  if (input.cursor) {
    cursor = decodeCursor(input.cursor);
    if (!cursor) {
      return err('VALIDATION', 'Некорректный cursor');
    }
  }

  const page = await listEntries({ limit: input.limit, cursor });
  return ok(page);
}

export async function createDirectoryEntry(
  actor: Actor,
  input: CreateEntryInput,
): Promise<Result<DirectoryEntry>> {
  if (!canCreateEntry(actor)) {
    return err('FORBIDDEN', 'Нет прав на изменение справочника');
  }

  const entry = await withTransaction((tx) =>
    insertEntry(tx, {
      name: input.name,
      description: input.description,
      ownerId: actor.id,
    }),
  );

  return ok(entry);
}
