import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config.js';

type HeaderGroup = { headers: { key: string; value: string }[] };

describe('security headers', () => {
  it('configures HSTS, nosniff, and Referrer-Policy for all routes', async () => {
    const headersFn = (nextConfig as unknown as { headers: () => Promise<HeaderGroup[]> })
      .headers;
    const groups = await headersFn();
    const headers = groups[0]?.headers ?? [];
    const byKey = new Map(
      headers.map((header) => [header.key.toLowerCase(), header.value]),
    );

    expect(byKey.get('strict-transport-security')).toContain('max-age=');
    expect(byKey.get('x-content-type-options')).toBe('nosniff');
    expect(byKey.get('referrer-policy')).toBeTruthy();
  });
});
