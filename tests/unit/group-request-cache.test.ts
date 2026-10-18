import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cacheRegistry, queryMock } = vi.hoisted(() => ({
  cacheRegistry: new Map<unknown, Map<string, unknown>>(),
  queryMock: vi.fn(),
}));

// react.cache is a no-op outside a React request scope, so mirror its
// per-request memoization to exercise the memoized service boundaries.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();

  function requestCache<T extends (...args: never[]) => unknown>(fn: T): T {
    return function (this: unknown, ...args: never[]) {
      let byFn = cacheRegistry.get(fn);
      if (!byFn) {
        byFn = new Map();
        cacheRegistry.set(fn, byFn);
      }
      const key = JSON.stringify(args);
      if (!byFn.has(key)) {
        byFn.set(key, fn.apply(this, args));
      }
      return byFn.get(key);
    } as T;
  }

  return { ...actual, cache: requestCache };
});

vi.mock('@/core/db/pool', () => ({ query: queryMock }));

import { canViewGroup, getGroup, getGroupRole } from '@/modules/groups';

const actor = { id: 7, role: 'employee' as const };
const groupRow = { id: 3, name: 'Киновечера', description: null, tags: [], restricted: false };
const roleRow = { role: 1 };

function stubQuery() {
  queryMock.mockImplementation(async (sql: string) => {
    if (sql.includes('SELECT role FROM group_members')) {
      return [roleRow];
    }
    if (sql.includes('FROM group_members gm')) {
      return [];
    }
    if (sql.includes('FROM groups g')) {
      return [groupRow];
    }
    return [];
  });
}

beforeEach(() => {
  cacheRegistry.clear();
  queryMock.mockReset();
  stubQuery();
});

describe('group request cache', () => {
  it('reads each part of the group context once for repeated calls in one request', async () => {
    expect(await canViewGroup(actor, 3)).toBe(true);
    expect(await canViewGroup(actor, 3)).toBe(true);

    const result = await getGroup(actor, 3);
    expect(result.ok).toBe(true);

    expect(await getGroupRole(3, actor.id)).toBe('admin');

    // One read of the group row, one of its members, one of its statistics and
    // one of the role, shared by GroupPage, getGroup, canViewGroup and the
    // panel services.
    expect(queryMock).toHaveBeenCalledTimes(4);
  });

  it('keeps separate groups as separate reads', async () => {
    await canViewGroup(actor, 3);
    const afterFirst = queryMock.mock.calls.length;

    await canViewGroup(actor, 4);

    expect(queryMock.mock.calls.length).toBe(afterFirst + 4);
  });

  it('denies a viewer without a session without reading the group', async () => {
    expect(await canViewGroup(null, 3)).toBe(false);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
