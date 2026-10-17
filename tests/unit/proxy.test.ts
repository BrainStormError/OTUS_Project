import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { buildSessionCookieConfig } from '@/modules/auth/session-cookie';

import { buildCsp, hasSessionCookie, proxy } from '@/proxy';

const secureCookie = buildSessionCookieConfig(true).name;
const plainCookie = buildSessionCookieConfig(false).name;

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe('proxy CSP', () => {
  it('authorizes inline scripts by digest and locks down the policy', () => {
    const csp = buildCsp(['abc123', 'def456'], 'production');
    expect(csp).toContain("script-src 'self' 'sha256-abc123' 'sha256-def456'");
    expect(csp).not.toContain('nonce-');
    expect(csp).not.toContain('strict-dynamic');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data: blob: https://image.tmdb.org");
  });

  it('sets a CSP header without issuing a per-request secret', () => {
    const response = proxy(request('/films', `${plainCookie}=token`));
    const csp = response.headers.get('content-security-policy');
    expect(csp).toBeTruthy();
    expect(csp).not.toContain('nonce-');
    expect(response.headers.get('x-nonce')).toBeNull();
  });

  it('allows unsafe-eval outside production but never in production', () => {
    expect(buildCsp([], 'development')).toContain("'unsafe-eval'");
    expect(buildCsp([], 'test')).toContain("'unsafe-eval'");
    expect(buildCsp([], 'production')).not.toContain("'unsafe-eval'");
  });
});

describe('proxy session guard', () => {
  it('redirects a document without a session cookie to login', () => {
    const response = proxy(request('/films'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login');
    expect(response.headers.get('content-security-policy')).toBeTruthy();
  });

  it('lets a document with a session cookie through', () => {
    const response = proxy(request('/films', `${plainCookie}=token`));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('accepts the secure cookie and chunked session cookies', () => {
    expect(hasSessionCookie(request('/', `${secureCookie}=token`))).toBe(true);
    expect(hasSessionCookie(request('/', `${plainCookie}.0=part`))).toBe(true);
  });

  it('never redirects API, auth, or login paths without a cookie', () => {
    for (const path of ['/login', '/api/records', '/api/auth/session', '/icon.svg']) {
      const response = proxy(request(path));
      expect(response.headers.get('x-middleware-next')).toBe('1');
    }
  });

  it('does not touch the database or crypto for the presence check', () => {
    expect(hasSessionCookie(request('/films', 'other=1'))).toBe(false);
  });
});
