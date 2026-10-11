import { createActionURL } from '@auth/core';
import { describe, expect, it } from 'vitest';

import { canonicalOrigin, ensureAuthUrl } from '@/core/config/env';

describe('canonical auth origin', () => {
  it('derives the origin from APP_ORIGIN', () => {
    expect(canonicalOrigin()).toBe('http://localhost:3000');
  });

  it('builds callback URLs from the canonical origin and ignores a spoofed host', () => {
    ensureAuthUrl();
    const headers = new Headers({
      host: 'evil.example',
      'x-forwarded-host': 'evil.example',
      'x-forwarded-proto': 'https',
    });

    const url = createActionURL('signin', 'http:', headers, process.env, {
      basePath: '/api/auth',
    });

    expect(url.origin).toBe('http://localhost:3000');
    expect(url.toString()).not.toContain('evil.example');
  });
});
