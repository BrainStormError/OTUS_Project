import { afterEach, describe, expect, it, vi } from 'vitest';

import { log, sanitizeFields } from '@/core/log/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sanitizeFields', () => {
  it('redacts sensitive keys at any depth', () => {
    const result = sanitizeFields({
      token: 'raw-token',
      nested: { sessionId: 's', keep: 'visible' },
      requestId: 'r-1',
    });
    expect(result.token).toBe('[REDACTED]');
    expect(result.nested).toEqual({ sessionId: '[REDACTED]', keep: 'visible' });
    expect(result.requestId).toBe('r-1');
  });

  it('strips control characters and line breaks from values', () => {
    const result = sanitizeFields({ value: 'a\nb\tc\u0000d' });
    expect(result.value).toBe('abcd');
  });
});

describe('log', () => {
  it('writes a single-line JSON entry with level, event, and timestamp', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    log('info', 'test.event', { requestId: 'r-1' });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0]?.[0] as string;
    expect(line.includes('\n')).toBe(false);
    const entry = JSON.parse(line);
    expect(entry.level).toBe('info');
    expect(entry.event).toBe('test.event');
    expect(entry.requestId).toBe('r-1');
    expect(typeof entry.at).toBe('string');
  });

  it('redacts sensitive fields and sanitizes request values before writing', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    log('info', 'test.event', { password: 'p', detail: 'x\ny' });

    const entry = JSON.parse(spy.mock.calls[0]?.[0] as string);
    expect(entry.password).toBe('[REDACTED]');
    expect(entry.detail).toBe('xy');
  });
});
