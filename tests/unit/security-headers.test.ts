import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config.js';

type HeaderGroup = {
  source: string;
  headers: { key: string; value: string }[];
  has?: { type: string; key: string }[];
  missing?: { type: string; key: string }[];
};

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

describe('client route cache window', () => {
  it('keeps the router cache reusable for the whole session (one year)', () => {
    const staleTimes = (nextConfig as unknown as {
      experimental: { staleTimes: { static: number; dynamic: number } };
    }).experimental.staleTimes;

    // Aligned with the flight-response policy; the same order of magnitude as
    // the served `x-nextjs-stale-time` value.
    expect(staleTimes.static).toBe(31536000);
    expect(staleTimes.dynamic).toBe(31536000);
  });
});

describe('navigation payload cache policy', () => {
  async function rules(): Promise<HeaderGroup[]> {
    const headersFn = (nextConfig as unknown as { headers: () => Promise<HeaderGroup[]> })
      .headers;
    return headersFn();
  }

  it('serves the HTML document private and revalidated, never shared-cacheable', async () => {
    const document = (await rules()).find((group) =>
      group.missing?.some((matcher) => matcher.type === 'query' && matcher.key === '_rsc'),
    );
    expect(document).toBeTruthy();
    // API reads and static assets are excluded from the policy.
    expect(document!.source).toContain('?!api/|_next/');

    const value = document!.headers.find(
      (header) => header.key.toLowerCase() === 'cache-control',
    )?.value;
    expect(value).toBe('private, no-cache');
    expect(value).not.toContain('public');
    expect(value).not.toContain('s-maxage');
  });

  it('serves flight payloads private and browser-cacheable for one year', async () => {
    const flight = (await rules()).find((group) =>
      group.has?.some((matcher) => matcher.type === 'query' && matcher.key === '_rsc'),
    );
    expect(flight).toBeTruthy();
    expect(flight!.source).toContain('?!api/|_next/');

    const value = flight!.headers.find(
      (header) => header.key.toLowerCase() === 'cache-control',
    )?.value;
    expect(value).toBe('private, max-age=31536000');
    expect(value).not.toContain('public');
    expect(value).not.toContain('s-maxage');
  });
});


