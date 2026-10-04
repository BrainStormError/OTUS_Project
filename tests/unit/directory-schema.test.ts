import { describe, expect, it } from 'vitest';

import {
  createEntryInput,
  DEFAULT_LIMIT,
  listDirectoryInput,
  MAX_LIMIT,
} from '@/modules/directory';

describe('listDirectoryInput', () => {
  it('applies the default limit', () => {
    const parsed = listDirectoryInput.parse({});
    expect(parsed.limit).toBe(DEFAULT_LIMIT);
  });

  it('coerces a numeric string limit', () => {
    expect(listDirectoryInput.parse({ limit: '5' }).limit).toBe(5);
  });

  it('rejects a limit above the maximum', () => {
    expect(listDirectoryInput.safeParse({ limit: MAX_LIMIT + 1 }).success).toBe(false);
  });

  it('rejects a non-positive limit', () => {
    expect(listDirectoryInput.safeParse({ limit: 0 }).success).toBe(false);
  });
});

describe('createEntryInput', () => {
  it('rejects an over-long name', () => {
    expect(createEntryInput.safeParse({ name: 'x'.repeat(201) }).success).toBe(false);
  });

  it('accepts a valid payload', () => {
    expect(createEntryInput.safeParse({ name: 'A', description: 'B' }).success).toBe(true);
  });
});
