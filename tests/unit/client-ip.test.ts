import { describe, expect, it } from 'vitest';

import { getClientIp, UNKNOWN_CLIENT_IP } from '@/core/http/client-ip';

function request(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/auth/session', { headers });
}

describe('getClientIp', () => {
  it('takes the left-most entry of a well-formed X-Forwarded-For chain', () => {
    expect(
      getClientIp(request({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 172.16.0.5' })),
    ).toBe('203.0.113.9');
  });

  it('accepts an IPv6 address', () => {
    expect(getClientIp(request({ 'x-forwarded-for': '2001:db8::1' }))).toBe('2001:db8::1');
  });

  it('collapses a forged non-IP header to the shared sentinel', () => {
    expect(getClientIp(request({ 'x-forwarded-for': 'attacker-controlled' }))).toBe(
      UNKNOWN_CLIENT_IP,
    );
  });

  it('collapses a malformed value to the shared sentinel', () => {
    expect(getClientIp(request({ 'x-forwarded-for': '999.999.999.999' }))).toBe(
      UNKNOWN_CLIENT_IP,
    );
  });

  it('ignores a client-supplied X-Real-IP', () => {
    expect(getClientIp(request({ 'x-real-ip': '203.0.113.9' }))).toBe(UNKNOWN_CLIENT_IP);
    expect(
      getClientIp(request({ 'x-forwarded-for': 'forged', 'x-real-ip': '203.0.113.9' })),
    ).toBe(UNKNOWN_CLIENT_IP);
  });

  it('returns the shared sentinel when no forwarding header is present', () => {
    expect(getClientIp(request())).toBe(UNKNOWN_CLIENT_IP);
  });
});
