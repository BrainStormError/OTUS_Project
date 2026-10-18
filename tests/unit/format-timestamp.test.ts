import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatTimestamp, resolveTimeZone } from '@/components/layout/preferences';

const ISO = '2024-01-05T14:07:00.000Z';

function stubTimeZone(timeZone: string): void {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('formatTimestamp', () => {
  it('renders HH:mm DD.MM.YY in the 24-hour form', () => {
    stubTimeZone('UTC');
    expect(formatTimestamp(ISO, { hour12: false })).toBe('14:07 05.01.24');
  });

  it('renders the 12-hour form with a day-period marker and the same date', () => {
    stubTimeZone('UTC');
    const value = formatTimestamp(ISO, { hour12: true });
    expect(value).toMatch(/^2:07\s?(AM|PM) 05\.01\.24$/);
  });

  it('applies the browser timezone to the moment', () => {
    stubTimeZone('Europe/Moscow');
    expect(formatTimestamp(ISO)).toBe('17:07 05.01.24');

    vi.restoreAllMocks();
    stubTimeZone('America/New_York');
    expect(formatTimestamp(ISO)).toBe('09:07 05.01.24');
  });

  it('falls back to UTC for an unavailable browser zone', () => {
    stubTimeZone('Not/AZone');
    expect(resolveTimeZone()).toBe('UTC');
    expect(formatTimestamp(ISO, { hour12: false })).toBe('14:07 05.01.24');
  });

  it('keeps a stable separator format regardless of the zone', () => {
    stubTimeZone('Asia/Tokyo');
    expect(formatTimestamp(ISO)).toMatch(/^\d{2}:\d{2} \d{2}\.\d{2}\.\d{2}$/);
  });
});
