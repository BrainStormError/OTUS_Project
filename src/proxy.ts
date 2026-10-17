import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextResponse, type NextRequest } from 'next/server';

import { readNodeEnv } from '@/core/config/env';
import { buildSessionCookieConfig } from '@/modules/auth/session-cookie';

export const CSP_HASHES_FILE = '.next/csp-hashes.json';

let cachedHashes: string[] | null = null;

export function readCspHashes(): string[] {
  if (cachedHashes !== null) {
    return cachedHashes;
  }
  try {
    const raw = readFileSync(join(process.cwd(), CSP_HASHES_FILE), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    cachedHashes = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    cachedHashes = [];
  }
  return cachedHashes;
}

export function buildCsp(
  hashes: readonly string[],
  nodeEnv: string | undefined = readNodeEnv(),
): string {
  // In development the build-time digests do not describe the dev server's
  // inline scripts (HMR, eval), so the policy falls back to unsafe-inline.
  // Production serves the digests recorded from the prebuilt documents.
  const scriptSrc =
    nodeEnv === 'production'
      ? ["'self'", ...hashes.map((hash) => `'sha256-${hash}'`)]
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://image.tmdb.org",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

function sessionCookieNames(): string[] {
  return [buildSessionCookieConfig(true).name, buildSessionCookieConfig(false).name];
}

// Presence-only check: no database and no cryptography run on the document
// path. A stale cookie still reaches the page and is refused by /api/*.
export function hasSessionCookie(request: NextRequest): boolean {
  const names = sessionCookieNames();
  return request.cookies
    .getAll()
    .some((cookie) => names.some((name) => cookie.name === name || cookie.name.startsWith(`${name}.`)));
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/icon.svg' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  );
}

function withPolicy(response: NextResponse, csp: string): NextResponse {
  response.headers.set('content-security-policy', csp);
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const csp = buildCsp(readCspHashes());
  const pathname = request.nextUrl.pathname;

  if (!isPublicPath(pathname) && !hasSessionCookie(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return withPolicy(NextResponse.redirect(loginUrl), csp);
  }

  return withPolicy(NextResponse.next(), csp);
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
