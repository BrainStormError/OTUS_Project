import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { buildCsp, createNonce, proxy } from '@/proxy';

describe('proxy CSP', () => {
  it('builds a policy containing the nonce and locking down objects and framing', () => {
    const csp = buildCsp('abc123');
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('sets the nonce and CSP headers on the response', () => {
    const request = new NextRequest('http://localhost/films');
    const response = proxy(request);
    const nonce = response.headers.get('x-nonce');
    expect(nonce).toBeTruthy();
    expect(response.headers.get('content-security-policy')).toContain(`nonce-${nonce}`);
  });

  it('generates unique nonces', () => {
    expect(createNonce()).not.toBe(createNonce());
  });

  it('allows unsafe-eval in development but not in production', () => {
    expect(buildCsp('n', 'development')).toContain("'unsafe-eval'");
    expect(buildCsp('n', 'test')).toContain("'unsafe-eval'");
    expect(buildCsp('n', 'production')).not.toContain("'unsafe-eval'");
  });
});
