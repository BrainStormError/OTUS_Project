import type { NextRequest } from 'next/server';

import { rateLimitByIp } from '@/core/http/rate-limit-guard';
import { handlers } from '@/modules/auth/auth';

// The sign-in / OAuth handler is throttled by the shared limiter, keyed by the
// proxy-set client IP, so brute-force and credential-stuffing attempts are
// refused across instances.
const AUTH_LIMIT = 120;
const AUTH_WINDOW_MS = 60_000;

export const GET = rateLimitByIp((request) => handlers.GET(request as NextRequest), {
  operation: 'auth.handler',
  limit: AUTH_LIMIT,
  windowMs: AUTH_WINDOW_MS,
});

export const POST = rateLimitByIp((request) => handlers.POST(request as NextRequest), {
  operation: 'auth.handler',
  limit: AUTH_LIMIT,
  windowMs: AUTH_WINDOW_MS,
});
