import { describe, expect, it } from 'vitest';

import { groupRatingInput } from '@/modules/groups';

const base = {
  groupId: 3,
  mediaKind: 'film',
  mediaRef: '27205',
  title: 'Начало',
  watchedAt: '2026-08-12',
};

describe('groupRatingInput', () => {
  it('coerces a numeric group id from the path', () => {
    const parsed = groupRatingInput.safeParse({ ...base, groupId: '3', rating: 5 });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.groupId).toBe(3);
  });

  it('accepts a decimal rating within range', () => {
    const parsed = groupRatingInput.safeParse({ ...base, rating: 8.4, comment: 'Хорошо' });
    expect(parsed.success).toBe(true);
  });

  it('accepts the boundary values 0 and 10', () => {
    expect(groupRatingInput.safeParse({ ...base, rating: 0 }).success).toBe(true);
    expect(groupRatingInput.safeParse({ ...base, rating: 10 }).success).toBe(true);
  });

  it('rejects ratings outside 0–10', () => {
    expect(groupRatingInput.safeParse({ ...base, rating: -1 }).success).toBe(false);
    expect(groupRatingInput.safeParse({ ...base, rating: 10.1 }).success).toBe(false);
  });

  it('rejects an invalid watch date', () => {
    expect(
      groupRatingInput.safeParse({ ...base, rating: 5, watchedAt: '12.08.2026' }).success,
    ).toBe(false);
  });
});
