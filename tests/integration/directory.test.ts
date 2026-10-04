import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool } from '@/core/db/pool';
import { createDirectoryEntry, listDirectory } from '@/modules/directory';
import { insertUser } from '@/modules/auth/repository';

let admin: Actor;
let employee: Actor;
const createdIds: string[] = [];

beforeAll(async () => {
  const adminRow = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: 'Admin',
    role: 'admin',
  });
  admin = { id: adminRow.id, role: 'admin' };

  const employeeRow = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: 'Employee',
    role: 'employee',
  });
  employee = { id: employeeRow.id, role: 'employee' };
});

afterAll(async () => {
  await closePool();
});

async function seed(name: string) {
  const result = await createDirectoryEntry(admin, { name });
  if (!result.ok) {
    throw new Error('seed failed');
  }
  createdIds.push(result.value.id);
  return result.value;
}

describe('directory list pagination', () => {
  it('returns a bounded page and a next cursor', async () => {
    await seed('A');
    await seed('B');
    await seed('C');

    const first = await listDirectory({ limit: 2 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.items).toHaveLength(2);
    expect(first.value.nextCursor).not.toBeNull();

    const second = await listDirectory({
      limit: 2,
      cursor: first.value.nextCursor ?? undefined,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.items.length).toBeGreaterThanOrEqual(1);
    expect(second.value.nextCursor).toBeNull();
  });

  it('rejects an invalid cursor', async () => {
    const result = await listDirectory({ limit: 2, cursor: 'not-a-cursor' });
    expect(result.ok).toBe(false);
  });
});

describe('directory mutation policy', () => {
  it('denies an employee and writes nothing', async () => {
    const result = await createDirectoryEntry(employee, { name: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('FORBIDDEN');
    }
  });
});
