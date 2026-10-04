import { describe, expect, it } from 'vitest';

import { issueTicket, verifyTicket } from '@/modules/auth/ticket';

describe('registration ticket', () => {
  it('accepts a freshly issued ticket for the matching email', () => {
    const token = issueTicket('user@example.com');
    const result = verifyTicket(token, 'user@example.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe('user@example.com');
    }
  });

  it('rejects an expired ticket', () => {
    const now = Date.now();
    const token = issueTicket('user@example.com', 60, now);
    const result = verifyTicket(token, 'user@example.com', now + 61_000);
    expect(result.ok).toBe(false);
  });

  it('rejects a ticket whose email does not match', () => {
    const token = issueTicket('user@example.com');
    const result = verifyTicket(token, 'other@example.com');
    expect(result.ok).toBe(false);
  });

  it('rejects a tampered ticket', () => {
    const token = issueTicket('user@example.com');
    const tampered = `${token.split('.')[0]}.deadbeef`;
    expect(verifyTicket(tampered, 'user@example.com').ok).toBe(false);
  });

  it('rejects a malformed token', () => {
    expect(verifyTicket('not-a-ticket', 'user@example.com').ok).toBe(false);
  });
});
