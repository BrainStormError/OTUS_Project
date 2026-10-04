import { describe, expect, it } from 'vitest';

import { isTrustedOrigin } from '@/core/http/origin';

const ALLOWED = 'https://app.example.com';

function request(headers: Record<string, string>): Request {
  return new Request('https://app.example.com/api/x', { method: 'POST', headers });
}

describe('isTrustedOrigin', () => {
  it('trusts a matching origin', () => {
    expect(isTrustedOrigin(request({ origin: ALLOWED }), ALLOWED)).toBe(true);
  });

  it('trusts fetch metadata indicating a same-origin request', () => {
    expect(isTrustedOrigin(request({ 'sec-fetch-site': 'same-origin' }), ALLOWED)).toBe(true);
  });

  it('rejects a mismatched origin', () => {
    expect(isTrustedOrigin(request({ origin: 'https://evil.example.com' }), ALLOWED)).toBe(false);
  });

  it('rejects a request with no origin or fetch metadata', () => {
    expect(isTrustedOrigin(request({}), ALLOWED)).toBe(false);
  });

  it('rejects a malformed origin', () => {
    expect(isTrustedOrigin(request({ origin: 'not-a-url' }), ALLOWED)).toBe(false);
  });
});
