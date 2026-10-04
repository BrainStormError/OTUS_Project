import { describe, expect, it } from 'vitest';

import { withTimeout } from '@/core/http/timeout';

describe('withTimeout', () => {
  it('resolves when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('rejects when the promise exceeds the timeout', async () => {
    const never = new Promise<string>(() => undefined);
    await expect(withTimeout(never, 10)).rejects.toThrowError('Timeout');
  });
});
