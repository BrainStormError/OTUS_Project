import { describe, expect, it } from 'vitest';

import { err, isErr, isOk, ok } from '@/core/result';

describe('result', () => {
  it('builds an Ok shape', () => {
    const result = ok({ id: '1' });
    expect(result).toEqual({ ok: true, value: { id: '1' } });
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it('builds an Err shape', () => {
    const result = err('FORBIDDEN', 'no');
    expect(result).toEqual({ ok: false, code: 'FORBIDDEN', message: 'no' });
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });
});
