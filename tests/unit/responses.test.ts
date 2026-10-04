import { describe, expect, it } from 'vitest';

import { json } from '@/core/http/responses';

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
