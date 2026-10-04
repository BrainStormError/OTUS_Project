import { describe, expect, it } from 'vitest';

import {
  buildSessionCookieConfig,
  buildSessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from '@/modules/auth/session-cookie';

describe('session cookie', () => {
  it('is HttpOnly, SameSite=Lax, and has a bounded TTL', () => {
    const options = buildSessionCookieOptions(true);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it('sets Secure for an https origin and clears it for http', () => {
    expect(buildSessionCookieOptions(true).secure).toBe(true);
    expect(buildSessionCookieOptions(false).secure).toBe(false);
  });

  it('applies the flags to the configured session token cookie', () => {
    const config = buildSessionCookieConfig(true);
    expect(config.name).toContain('session-token');
    expect(config.options.httpOnly).toBe(true);
    expect(config.options.sameSite).toBe('lax');
    expect(config.options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
  });
});
