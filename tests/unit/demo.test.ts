import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findOrCreateDemoUserMock } = vi.hoisted(() => ({
  findOrCreateDemoUserMock: vi.fn(),
}));

vi.mock('@/core/config/env', () => ({
  env: { NODE_ENV: 'test', DEMO_LOGIN: '1', LOG_LEVEL: 'info' },
}));

vi.mock('@/modules/auth/repository', () => ({
  findOrCreateDemoUser: findOrCreateDemoUserMock,
}));

import { authorizeDemoUser, isDemoLoginEnabled } from '@/modules/auth/demo';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isDemoLoginEnabled', () => {
  it('is only enabled when configured and outside production', () => {
    expect(isDemoLoginEnabled('production', '1')).toBe(false);
    expect(isDemoLoginEnabled('development', '1')).toBe(true);
    expect(isDemoLoginEnabled('test', '1')).toBe(true);
    expect(isDemoLoginEnabled('development', '0')).toBe(false);
  });
});

describe('authorizeDemoUser audit trail', () => {
  it('emits a success record with no secret fields', async () => {
    findOrCreateDemoUserMock.mockResolvedValue({ id: 7, email: 'demo@example.com', name: 'Demo' });
    const lines: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((line) => {
      lines.push(String(line));
    });

    const user = await authorizeDemoUser({ email: 'demo@example.com' });

    spy.mockRestore();
    expect(user).toMatchObject({ id: '7', email: 'demo@example.com' });
    const entry = lines.find((line) => line.includes('auth.signin.success'));
    expect(entry).toBeDefined();
    expect(entry).toContain('"provider":"demo"');
    expect(entry).not.toMatch(/token|ticket|session|password|credential/i);
  });

  it('emits a failure record for a refused attempt', async () => {
    findOrCreateDemoUserMock.mockResolvedValue(null);
    const lines: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((line) => {
      lines.push(String(line));
    });

    expect(await authorizeDemoUser({ email: 'taken@example.com' })).toBeNull();

    spy.mockRestore();
    const entry = lines.find((line) => line.includes('auth.signin.failed'));
    expect(entry).toBeDefined();
    expect(entry).not.toMatch(/token|ticket|session|password|credential/i);
  });
});
