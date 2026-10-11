import { describe, expect, it } from 'vitest';

import { identityUpdateInput } from '@/modules/auth/schema';

describe('identityUpdateInput', () => {
  it('accepts a trimmed display name', () => {
    expect(identityUpdateInput.parse({ name: '  Алексей  ' })).toEqual({ name: 'Алексей' });
  });

  it('accepts a valid tag', () => {
    expect(identityUpdateInput.parse({ handle: ' film_club-2 ' })).toEqual({
      handle: 'film_club-2',
    });
  });

  it('accepts both fields together', () => {
    expect(identityUpdateInput.parse({ name: 'Ника', handle: 'nick-1' })).toEqual({
      name: 'Ника',
      handle: 'nick-1',
    });
  });

  it('rejects an empty body', () => {
    expect(identityUpdateInput.safeParse({}).success).toBe(false);
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(identityUpdateInput.safeParse({ name: '' }).success).toBe(false);
    expect(identityUpdateInput.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    expect(identityUpdateInput.safeParse({ name: 'a'.repeat(100) }).success).toBe(true);
    expect(identityUpdateInput.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('rejects uppercase, whitespace and disallowed tag characters', () => {
    for (const handle of ['Admin', 'a b', 'ab!', 'тег', 'ab.cd']) {
      expect(identityUpdateInput.safeParse({ handle }).success, handle).toBe(false);
    }
  });

  it('rejects a tag longer than 50 characters', () => {
    expect(identityUpdateInput.safeParse({ handle: 'a'.repeat(50) }).success).toBe(true);
    expect(identityUpdateInput.safeParse({ handle: 'a'.repeat(51) }).success).toBe(false);
  });

  it('rejects reserved tags', () => {
    expect(identityUpdateInput.safeParse({ handle: 'admin' }).success).toBe(false);
    expect(identityUpdateInput.safeParse({ handle: 'root' }).success).toBe(false);
  });
});
