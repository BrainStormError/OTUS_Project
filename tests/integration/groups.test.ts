import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';
import { insertUser } from '@/modules/auth/repository';
import { createGroup, getGroup, getGroupRole, updateGroup } from '@/modules/groups';
import {
  findGroupById,
  insertGroup,
  resolveTagIds,
  updateGroupRow,
} from '@/modules/groups/repository';

afterAll(async () => {
  await closePool();
});

async function makeUser(): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: `group-${randomUUID().slice(0, 6)}`,
    role: 'employee',
  });
  return { id: row.id, role: 'employee' };
}

describe('resolveTagIds', () => {
  it('inserts new tags, dedups without case and reuses existing rows', async () => {
    const base = `Тег${randomUUID().slice(0, 8)}`;

    const first = await withTransaction((tx) => resolveTagIds(tx, [`  ${base}  `]));
    expect(first).toHaveLength(1);

    const mixed = await withTransaction((tx) =>
      resolveTagIds(tx, [base.toUpperCase(), base.toUpperCase()]),
    );
    expect(mixed).toEqual(first);

    const rows = await query<{ name: string }>('SELECT name FROM tags WHERE id = $1', [first[0]]);
    expect(rows[0]?.name).toBe(base);
  });

  it('inserts one row for two case-variant values in a single call', async () => {
    const base = `Тег${randomUUID().slice(0, 8)}`;
    const ids = await withTransaction((tx) => resolveTagIds(tx, [base, base.toUpperCase()]));
    expect(ids).toHaveLength(1);
  });
});

describe('group repository', () => {
  it('inserts a group with tags and reads it back with the tag names', async () => {
    const owner = await makeUser();
    const tag = `тег${randomUUID().slice(0, 8)}`;

    const groupId = await withTransaction(async (tx) => {
      const tagIds = await resolveTagIds(tx, [tag]);
      return insertGroup(tx, {
        name: `Группа ${randomUUID().slice(0, 8)}`,
        description: 'Описание',
        restricted: false,
        tagIds,
      });
    });

    const group = await findGroupById(groupId);
    expect(group).not.toBeNull();
    expect(group?.description).toBe('Описание');
    expect(group?.tags).toEqual([tag]);
    expect(owner.id).toBeDefined();
  });

  it('updates name, visibility and tags', async () => {
    const groupId = await withTransaction(async (tx) =>
      insertGroup(tx, {
        name: `Группа ${randomUUID().slice(0, 8)}`,
        description: null,
        restricted: false,
        tagIds: [],
      }),
    );
    const newTag = `тег${randomUUID().slice(0, 8)}`;

    await withTransaction(async (tx) => {
      const tagIds = await resolveTagIds(tx, [newTag]);
      await updateGroupRow(tx, groupId, { restricted: true, tagIds });
    });

    const group = await findGroupById(groupId);
    expect(group?.restricted).toBe(true);
    expect(group?.tags).toEqual([newTag]);
  });
});

describe('createGroup', () => {
  it('creates the group with the creator as administrator', async () => {
    const actor = await makeUser();
    const name = `Созданная ${randomUUID().slice(0, 8)}`;

    const result = await createGroup(actor, { name, tags: ['пятница'], restricted: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.name).toBe(name);
    expect(result.value.restricted).toBe(true);
    expect(result.value.tags).toEqual(['пятница']);
    expect(await getGroupRole(result.value.id, actor.id)).toBe('admin');
  });

  it('rejects a name that differs only by letter case', async () => {
    const actor = await makeUser();
    const name = `Уникальная ${randomUUID().slice(0, 8)}`;

    const first = await createGroup(actor, { name });
    expect(first.ok).toBe(true);

    const clash = await createGroup(actor, { name: name.toUpperCase() });
    expect(clash).toMatchObject({ ok: false, code: 'CONFLICT' });
  });

  it('trims the name and stores no description when omitted', async () => {
    const actor = await makeUser();
    const result = await createGroup(actor, { name: `  Обрезанная ${randomUUID().slice(0, 8)}  ` });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.description).toBeNull();
  });
});

describe('updateGroup', () => {
  it('lets an administrator change visibility and tags', async () => {
    const admin = await makeUser();
    const created = await createGroup(admin, { name: `Настройки ${randomUUID().slice(0, 8)}` });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const tag = `новый${randomUUID().slice(0, 8)}`;
    const updated = await updateGroup(admin, {
      groupId: created.value.id,
      restricted: true,
      tags: [tag],
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.restricted).toBe(true);
    expect(updated.value.tags).toEqual([tag]);
  });

  it('rejects a non-administrator and a non-member', async () => {
    const admin = await makeUser();
    const stranger = await makeUser();
    const created = await createGroup(admin, { name: `Защита ${randomUUID().slice(0, 8)}` });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const denied = await updateGroup(stranger, { groupId: created.value.id, restricted: true });
    expect(denied).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const unchanged = await getGroup(admin, created.value.id);
    expect(unchanged.ok).toBe(true);
    if (!unchanged.ok) return;
    expect(unchanged.value.restricted).toBe(false);
  });
});
