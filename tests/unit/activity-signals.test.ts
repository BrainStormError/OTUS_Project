import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/core/db/pool', () => ({ query: queryMock }));

import {
  findSignalForUser,
  listFeedEvents,
  listGroupFeedEvents,
} from '@/modules/activity/repository';

beforeEach(() => {
  queryMock.mockReset();
  queryMock.mockResolvedValue([]);
});

function listingQueries(): string[] {
  return queryMock.mock.calls
    .map(([sql]) => String(sql))
    .filter((sql) => sql.includes('SELECT') && sql.includes('FROM activity_events'));
}

describe('invalidation signals never appear in feed results', () => {
  it('excludes signal kinds and targeted rows from the feed listing query', async () => {
    await listFeedEvents({ viewerId: 1, limit: 20, cursor: null, since: null });

    const [sql] = listingQueries();
    expect(sql).toBeTruthy();
    expect(sql).toContain('e.kind NOT IN (6, 7, 8, 9)');
    expect(sql).toContain('e.target_user_id IS NULL');
  });

  it('excludes signal kinds and targeted rows from the group feed listing query', async () => {
    await listGroupFeedEvents({ viewerId: 1, groupId: 2, limit: 20, cursor: null });

    const [sql] = listingQueries();
    expect(sql).toBeTruthy();
    expect(sql).toContain('e.kind NOT IN (6, 7, 8, 9)');
    expect(sql).toContain('e.target_user_id IS NULL');
  });
});

describe('findSignalForUser', () => {
  it('resolves a signal kind only for the targeted recipient', async () => {
    queryMock.mockResolvedValue([{ kind: 6 }]);
    expect(await findSignalForUser(1, 10)).toBe('friend_removed');
    expect(queryMock.mock.calls[0]![1]).toEqual([1, 10]);
  });

  it('resolves nothing for a feed kind or a missing row', async () => {
    queryMock.mockResolvedValueOnce([{ kind: 0 }]);
    expect(await findSignalForUser(1, 10)).toBeNull();

    queryMock.mockResolvedValueOnce([]);
    expect(await findSignalForUser(1, 11)).toBeNull();
  });
});
