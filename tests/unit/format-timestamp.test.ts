import { describe, expect, it } from 'vitest';

import { formatTimestamp, resolveTimeZone } from '@/components/layout/preferences';

const ISO = '2024-01-05T14:07:00.000Z';

describe('formatTimestamp', () => {
  it('renders HH:mm DD.MM.YY in the 24-hour form', () => {
    expect(formatTimestamp(ISO, { timeZone: 'UTC', hour12: false })).toBe('14:07 05.01.24');
  });

  it('renders the 12-hour form with a day-period marker and the same date', () => {
    const value = formatTimestamp(ISO, { timeZone: 'UTC', hour12: true });
    expect(value).toMatch(/^2:07\s?(AM|PM) 05\.01\.24$/);
  });

  it('applies the selected timezone to the moment', () => {
    expect(formatTimestamp(ISO, { timeZone: 'Europe/Moscow' })).toBe('17:07 05.01.24');
    expect(formatTimestamp(ISO, { timeZone: 'America/New_York' })).toBe('09:07 05.01.24');
  });

  it('falls back to the browser timezone for an unavailable zone', () => {
    const fallback = formatTimestamp(ISO, { timeZone: resolveTimeZone() });
    expect(formatTimestamp(ISO, { timeZone: 'Not/AZone' })).toBe(fallback);
    expect(resolveTimeZone('Not/AZone')).toBe(resolveTimeZone());
  });

  it('keeps a stable separator format regardless of the zone', () => {
    expect(formatTimestamp(ISO, { timeZone: 'Asia/Tokyo' })).toMatch(
      /^\d{2}:\d{2} \d{2}\.\d{2}\.\d{2}$/,
    );
  });
});
