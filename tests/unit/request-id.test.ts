import { describe, expect, it } from 'vitest';

import { getRequestId } from '@/core/log/request-id';

describe('getRequestId', () => {
  it('uses an incoming request id when present', () => {
    const request = new Request('http://localhost/api/x', {
      headers: { 'x-request-id': 'incoming-123' },
    });
    expect(getRequestId(request)).toBe('incoming-123');
  });

  it('generates an id when the header is absent', () => {
    const request = new Request('http://localhost/api/x');
    const id = getRequestId(request);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('strips control characters from an incoming id', () => {
    const request = {
      headers: { get: () => 'a\nb' },
    } as unknown as Request;
    expect(getRequestId(request)).toBe('ab');
  });
});
