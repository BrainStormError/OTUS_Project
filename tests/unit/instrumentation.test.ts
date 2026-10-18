import { beforeEach, describe, expect, it, vi } from 'vitest';

const { warmPoolMock, startCacheSweepMock } = vi.hoisted(() => ({
  warmPoolMock: vi.fn<() => Promise<void>>(),
  startCacheSweepMock: vi.fn(),
}));

vi.mock('@/core/db/pool', () => ({ warmPool: warmPoolMock }));
vi.mock('@/modules/catalog/service', () => ({ startCacheSweep: startCacheSweepMock }));

import { register } from '@/instrumentation';

describe('application startup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    warmPoolMock.mockResolvedValue(undefined);
    process.env.NEXT_RUNTIME = 'nodejs';
  });

  it('warms the database pool before serving requests', async () => {
    await register();
    expect(warmPoolMock).toHaveBeenCalledTimes(1);
    expect(startCacheSweepMock).toHaveBeenCalledTimes(1);
  });

  it('keeps starting the cache sweep when the warm-up fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warmPoolMock.mockRejectedValueOnce(new Error('database unreachable'));

    await register();

    expect(errorSpy).toHaveBeenCalled();
    expect(startCacheSweepMock).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('does nothing outside the nodejs runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';
    await register();
    expect(warmPoolMock).not.toHaveBeenCalled();
    expect(startCacheSweepMock).not.toHaveBeenCalled();
  });
});
