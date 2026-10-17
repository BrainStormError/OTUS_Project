import { describe, expect, it } from 'vitest';

import { CACHE_CATALOG, CACHE_LIVE_FEED, CACHE_SINGLE_AUTHOR, json } from '@/core/http/responses';

describe('json', () => {
  it('serializes the body with a JSON content type and default status', async () => {
    const response = json({ status: 'ok' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('honors a custom status and merges headers', async () => {
    const response = json({ error: 'nope' }, 403, { 'x-request-id': 'r-1' });
    expect(response.status).toBe(403);
    expect(response.headers.get('x-request-id')).toBe('r-1');
  });
});

describe('read cache policies', () => {
  const policies = [CACHE_SINGLE_AUTHOR, CACHE_LIVE_FEED, CACHE_CATALOG];

  it('marks every read policy private and never cacheable by shared caches', () => {
    for (const policy of policies) {
      expect(policy).toContain('private');
      expect(policy).not.toContain('public');
      expect(policy).not.toContain('s-maxage');
      expect(policy).toMatch(/max-age=\d+/);
    }
  });

  it('keeps single-author reads cacheable until a mutation invalidates them', () => {
    expect(CACHE_SINGLE_AUTHOR).toBe('private, max-age=31536000');
  });

  it('leaves responses without an explicit policy uncacheable', () => {
    expect(json({ ok: true }).headers.get('cache-control')).toBeNull();
  });
});