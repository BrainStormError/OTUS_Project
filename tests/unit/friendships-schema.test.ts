import { describe, expect, it } from 'vitest';

import {
  createFriendRequestInput,
  friendshipDecisionInput,
  userSearchInput,
} from '@/modules/friendships/schema';

describe('userSearchInput', () => {
  it('trims the query and accepts values inside the length limit', () => {
    const parsed = userSearchInput.safeParse({ q: '  Иван  ' });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.q).toBe('Иван');
  });

  it('rejects whitespace-only and overlong queries', () => {
    expect(userSearchInput.safeParse({ q: '   ' }).success).toBe(false);
    expect(userSearchInput.safeParse({ q: 'а'.repeat(101) }).success).toBe(false);
  });

  it('requires a query', () => {
    expect(userSearchInput.safeParse({}).success).toBe(false);
  });
});

describe('createFriendRequestInput', () => {
  it('accepts a numeric addressee', () => {
    const parsed = createFriendRequestInput.safeParse({ addresseeId: '42' });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.addresseeId).toBe(42);
  });

  it('rejects a non-numeric addressee', () => {
    expect(createFriendRequestInput.safeParse({ addresseeId: 'not-a-number' }).success).toBe(false);
    expect(createFriendRequestInput.safeParse({ addresseeId: -1 }).success).toBe(false);
    expect(createFriendRequestInput.safeParse({}).success).toBe(false);
  });
});

describe('friendshipDecisionInput', () => {
  it('accepts a positive integer friendship id and rejects anything else', () => {
    expect(friendshipDecisionInput.safeParse({ friendshipId: 7 }).success).toBe(true);
    expect(friendshipDecisionInput.safeParse({ friendshipId: 'nope' }).success).toBe(false);
    expect(friendshipDecisionInput.safeParse({ friendshipId: 0 }).success).toBe(false);
  });
});
