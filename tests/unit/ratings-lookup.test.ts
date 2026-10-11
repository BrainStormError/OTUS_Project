import type { PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { findMediaIdByRef, hasPersonalRating } from '@/modules/ratings/repository';

function fakeClient(rows: unknown[]): { client: PoolClient; query: ReturnType<typeof vi.fn> } {
  const query = vi.fn().mockResolvedValue({ rows });
  return { client: { query } as unknown as PoolClient, query };
}

describe('findMediaIdByRef', () => {
  it('reports a missing media as null without a rating lookup', async () => {
    const { client, query } = fakeClient([]);
    const mediaId = await findMediaIdByRef(client, 'film', 'missing-ref');
    expect(mediaId).toBeNull();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM media'), [0, 'missing-ref']);
  });

  it('returns the id for an existing media and encodes the kind', async () => {
    const { client, query } = fakeClient([{ id: 42 }]);
    const mediaId = await findMediaIdByRef(client, 'series', 'tv-1');
    expect(mediaId).toBe(42);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM media'), [1, 'tv-1']);
  });
});

describe('hasPersonalRating', () => {
  it('reports a private personal row as present', async () => {
    const { client, query } = fakeClient([{ exists: true }]);
    expect(await hasPersonalRating(client, 7, 42)).toBe(true);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('group_id IS NULL'), [7, 42]);
  });

  it('reports no personal row as absent', async () => {
    const { client } = fakeClient([{ exists: false }]);
    expect(await hasPersonalRating(client, 7, 42)).toBe(false);
  });
});
