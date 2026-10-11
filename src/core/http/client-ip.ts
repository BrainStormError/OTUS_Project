import { isIP } from 'node:net';

// The client identity used for throttling must never be minted by the client.
// The app is bound to loopback and only a trusted edge can reach it, and that
// edge overwrites X-Forwarded-For with the real client address (see
// TRUSTED_PROXIES and docs/07-deployment-observability.md). So the left-most
// entry is trusted *only* when it is a well-formed IP; X-Real-IP is never
// consulted because the edge does not set it and a client can. Any value the
// app cannot attribute collapses to one shared sentinel, so a forged or
// missing header cannot produce a fresh limiter key per request.
export const UNKNOWN_CLIENT_IP = 'unknown';

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first && isIP(first) !== 0) {
      return first;
    }
  }
  return UNKNOWN_CLIENT_IP;
}
