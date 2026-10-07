import { describe, expect, it } from 'vitest';

import {
  decodeCursor,
  DEFAULT_FEED_LIMIT,
  encodeCursor,
  listFeedInput,
  MAX_FEED_LIMIT,
} from '@/modules/activity';

describe('activity feed schema', () => {
  it('applies the default limit when none is provided', () => {
    expect(listFeedInput.parse({}).limit).toBe(DEFAULT_FEED_LIMIT);
  });

  it('coerces a numeric string limit', () => {
    expect(listFeedInput.parse({ limit: '10' }).limit).toBe(10);
  });

  it('rejects a limit above the maximum', () => {
    expect(listFeedInput.safeParse({ limit: MAX_FEED_LIMIT + 1 }).success).toBe(false);
  });

  it('rejects a zero or negative limit', () => {
    expect(listFeedInput.safeParse({ limit: 0 }).success).toBe(false);
    expect(listFeedInput.safeParse({ limit: -3 }).success).toBe(false);
  });
});

describe('activity cursor', () => {
  it('round-trips a createdAt and numeric id pair', () => {
    const cursor = encodeCursor('2026-08-24T10:00:00.000Z', 42);
    expect(decodeCursor(cursor)).toEqual({
      createdAt: '2026-08-24T10:00:00.000Z',
      id: 42,
    });
  });

  it('rejects malformed cursors', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor(Buffer.from('2026-08-24T10:00:00.000Z|event-1').toString('base64url'))).toBeNull();
  });
});
