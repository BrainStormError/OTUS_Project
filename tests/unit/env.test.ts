import { describe, expect, it } from 'vitest';

import { parseEnv } from '@/core/config/env';

const valid = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  APP_ORIGIN: 'http://localhost:3000',
  SESSION_SECRET: 'a'.repeat(32),
  REGISTRATION_TICKET_SECRET: 'b'.repeat(32),
  OAUTH_CLIENT_ID: 'client-id',
  OAUTH_CLIENT_SECRET: 'client-secret',
  DEMO_LOGIN: '0',
  LOG_LEVEL: 'info',
};

describe('parseEnv', () => {
  it('returns typed configuration for valid values', () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('throws and names the missing variable without exposing values', () => {
    const { SESSION_SECRET: _omitted, ...withoutSecret } = valid;
    expect(() => parseEnv(withoutSecret)).toThrowError(/SESSION_SECRET/);
  });

  it('throws and names a malformed variable', () => {
    expect(() => parseEnv({ ...valid, APP_ORIGIN: 'not-a-url' })).toThrowError(/APP_ORIGIN/);
  });
});
