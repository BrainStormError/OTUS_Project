import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { writeHour12, writeTimezone } from '@/components/layout/preferences';
import { Timestamp } from '@/components/ui/timestamp';

const ISO = '2024-01-05T14:07:00.000Z';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Timestamp', () => {
  it('renders no text before mounting so server and client markup match', () => {
    const html = renderToString(<Timestamp value={ISO} />);
    expect(html).toContain('<time');
    expect(html).toContain(ISO);
    expect(html).not.toContain('05.01.24');
  });

  it('renders the formatted moment after mounting', async () => {
    writeTimezone('UTC');
    writeHour12(false);
    render(<Timestamp value={ISO} />);
    expect(await screen.findByText('14:07 05.01.24')).toBeInTheDocument();
  });

  it('updates the output when the timezone preference changes', async () => {
    writeTimezone('UTC');
    render(<Timestamp value={ISO} />);
    await screen.findByText('14:07 05.01.24');

    act(() => {
      writeTimezone('Europe/Moscow');
    });

    expect(await screen.findByText('17:07 05.01.24')).toBeInTheDocument();
  });
});
