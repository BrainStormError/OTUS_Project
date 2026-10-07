import { describe, expect, it } from 'vitest';

import { privacyInput } from '@/modules/auth/schema';

describe('privacyInput', () => {
  it('parses a partial body', () => {
    expect(privacyInput.parse({ profileHidden: true })).toEqual({ profileHidden: true });
    expect(privacyInput.parse({ statsHidden: false })).toEqual({ statsHidden: false });
  });

  it('rejects an empty body', () => {
    expect(privacyInput.safeParse({}).success).toBe(false);
  });

  it('rejects non-boolean values', () => {
    expect(privacyInput.safeParse({ profileHidden: 'yes' }).success).toBe(false);
  });
});
