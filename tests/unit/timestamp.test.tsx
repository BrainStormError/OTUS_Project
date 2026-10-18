import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { writeHour12 } from '@/components/layout/preferences';
import { Timestamp } from '@/components/ui/timestamp';

const ISO = '2024-01-05T14:07:00.000Z';

function stubTimeZone(timeZone: string): void {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Timestamp', () => {
  it('renders no text before mounting so server and client markup match', () => {
    const html = renderToString(<Timestamp value={ISO} />);
    expect(html).toContain('<time');
    expect(html).toContain(ISO);
    expect(html).not.toContain('05.01.24');
  });

  it('renders the formatted moment in the browser timezone after mounting', async () => {
    stubTimeZone('UTC');
    writeHour12(false);
    render(<Timestamp value={ISO} />);
    expect(await screen.findByText('14:07 05.01.24')).toBeInTheDocument();
  });

  it('updates the output when the hour cycle changes', async () => {
    stubTimeZone('UTC');
    writeHour12(false);
    render(<Timestamp value={ISO} />);
    await screen.findByText('14:07 05.01.24');

    act(() => {
      writeHour12(true);
    });

    expect(await screen.findByText(/2:07\s?(AM|PM) 05\.01\.24/)).toBeInTheDocument();
  });
});
