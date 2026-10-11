import { describe, expect, it } from 'vitest';

import { MemoryRateLimiter } from '@/core/http/rate-limit';

describe('MemoryRateLimiter', () => {
  it('counts requests against the window', async () => {
    const limiter = new MemoryRateLimiter(() => 0, 1000);
    expect(await limiter.consume('k', 2, 1_000)).toBe(true);
    expect(await limiter.consume('k', 2, 1_000)).toBe(true);
    expect(await limiter.consume('k', 2, 1_000)).toBe(false);
  });

  it('keeps memory bounded under a burst of distinct keys', async () => {
    const limiter = new MemoryRateLimiter(() => 0, 100);
    for (let index = 0; index < 5_000; index += 1) {
      await limiter.consume(`key-${index}`, 1, 60_000);
    }
    expect(limiter.size()).toBeLessThanOrEqual(100);
  });

  it('evicts idle keys', async () => {
    let now = 0;
    const limiter = new MemoryRateLimiter(() => now, 1_000);
    await limiter.consume('idle-a', 1, 1_000);
    await limiter.consume('idle-b', 1, 1_000);
    expect(limiter.size()).toBe(2);

    now = 10_000;
    for (let index = 0; index < 200; index += 1) {
      await limiter.consume(`fresh-${index}`, 1, 1_000);
    }
    // The two idle keys were swept away; only the fresh keys remain.
    expect(limiter.size()).toBe(200);
  });
});
