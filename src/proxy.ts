import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextResponse, type NextRequest } from 'next/server';

import { readNodeEnv } from '@/core/config/env';
import { buildSessionCookieConfig } from '@/modules/auth/session-cookie';

export const CSP_HASHES_FILE = '.next/csp-hashes.json';
export const BUILD_ID_FILE = '.next/BUILD_ID';
export const BUILD_MARKER_COOKIE = 'build-id';
export const BUILD_MARKER_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Cache-Control for navigation payloads is declared in next.config.js
// (`headers()`): the proxy cannot branch on flight requests here, because this
// Next version strips the `RSC` header and the `_rsc` query from the request
// before the proxy runs, while `headers()` still matches on `_rsc`.
export const CACHE_CLEAR_DIRECTIVE = '"cache"';

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

let cachedBuildId: string | null = null;

// The running build id is a build artifact, read once at startup like the CSP
// hashes. It is the server side of the deployment cache marker.
export function readBuildId(): string | null {
  if (cachedBuildId !== null) {
    return cachedBuildId;
  }
  try {
    cachedBuildId = readFileSync(join(process.cwd(), BUILD_ID_FILE), 'utf8').trim() || null;
  } catch {
    cachedBuildId = null;
  }
  return cachedBuildId;
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

// A deployment changes the build id; a request carrying the previous id clears
// the origin's HTTP cache once and stores the new marker. Only `cache` is
// requested - `storage` would wipe the theme preference in localStorage.
export function applyBuildMarker(
  response: NextResponse,
  request: NextRequest,
  buildId: string | null = readBuildId(),
): void {
  if (buildId === null || request.cookies.get(BUILD_MARKER_COOKIE)?.value === buildId) {
    return;
  }
  response.headers.set('clear-site-data', CACHE_CLEAR_DIRECTIVE);
  response.cookies.set(BUILD_MARKER_COOKIE, buildId, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    maxAge: BUILD_MARKER_MAX_AGE_SECONDS,
  });
}

function withPolicy(response: NextResponse, request: NextRequest, csp: string): NextResponse {
  response.headers.set('content-security-policy', csp);
  applyBuildMarker(response, request);
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const csp = buildCsp(readCspHashes());
  const pathname = request.nextUrl.pathname;

  if (!isPublicPath(pathname) && !hasSessionCookie(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return withPolicy(NextResponse.redirect(loginUrl), request, csp);
  }

  return withPolicy(NextResponse.next(), request, csp);
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
