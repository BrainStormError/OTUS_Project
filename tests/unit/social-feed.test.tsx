import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SocialFeed } from '@/components/features/movie-tracker/SocialFeed';
import type { FeedEvent } from '@/components/features/movie-tracker/feed';

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  listeners = new Map<string, Array<(event: MessageEvent) => void>>();
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  emit(type: string, payload: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data: JSON.stringify(payload) } as MessageEvent);
    }
  }

  close() {
    this.closed = true;
  }
}

function event(id: number, title: string): FeedEvent {
  return {
    id,
    cursor: `cursor-${id}`,
    source: 'friend',
    sourceName: 'Мария',
    kind: 'film',
    title,
    rating: 8.5,
    watchedAt: '2026-08-24',
    href: '/film/155',
    action: 'оценил(а)',
  };
}

const originalEventSource: unknown = globalThis.EventSource;

beforeEach(() => {
  FakeEventSource.instances = [];
  (globalThis as unknown as { EventSource: typeof FakeEventSource }).EventSource =
    FakeEventSource;
});

afterEach(() => {
  if (originalEventSource === undefined) {
    delete (globalThis as unknown as { EventSource?: unknown }).EventSource;
  } else {
    (globalThis as unknown as { EventSource?: unknown }).EventSource = originalEventSource;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SocialFeed live updates', () => {
  it('prepends an event that arrives after subscription and shows the indicator', async () => {
    render(<SocialFeed initialEvents={[event(1, 'Начало')]} />);
    const source = FakeEventSource.instances[0]!;
    expect(source.url).toBe('/api/feed/stream');

    act(() => {
      source.emit('activity', event(2, 'Матрица'));
    });

    expect(await screen.findByText('Матрица')).toBeInTheDocument();
    expect(screen.getByText(/Новые записи/)).toBeInTheDocument();
  });

  it('falls back to re-fetching the feed when the stream errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [event(9, 'Форрест Гамп')] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<SocialFeed initialEvents={[event(1, 'Начало')]} />);
    const source = FakeEventSource.instances[0]!;

    act(() => {
      source.onerror?.();
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/feed'));
    expect(await screen.findByText('Форрест Гамп')).toBeInTheDocument();
  });
});

describe('SocialFeed size control', () => {
  it('renders every loaded event in a scrollable viewport sized by the selector', async () => {
    const events = Array.from({ length: 30 }, (_, index) =>
      event(index, `Фильм ${index}`),
    );
    render(<SocialFeed initialEvents={events} />);

    const list = screen.getByTestId('social-feed');
    expect(list).toHaveAttribute('data-size', '5');
    expect(list.className).toContain('overflow-y-auto');
    expect(list.style.maxHeight).toBe('22.5rem');
    expect(within(list).getAllByRole('listitem')).toHaveLength(30);

    await userEvent.click(screen.getByRole('button', { name: '25' }));

    const grown = screen.getByTestId('social-feed');
    expect(grown).toHaveAttribute('data-size', '25');
    expect(grown.style.maxHeight).toBe('112.5rem');
    expect(within(grown).getAllByRole('listitem')).toHaveLength(30);
  });

  it('scrolls back to the newest entry when the pending indicator is used', async () => {
    render(<SocialFeed initialEvents={[event(1, 'Начало')]} />);
    const source = FakeEventSource.instances[0]!;

    act(() => {
      source.emit('activity', event(2, 'Матрица'));
    });

    const list = screen.getByTestId('social-feed');
    list.scrollTop = 120;

    await userEvent.click(screen.getByRole('button', { name: /Новые записи/ }));

    expect(list.scrollTop).toBe(0);
    expect(screen.queryByRole('button', { name: /Новые записи/ })).not.toBeInTheDocument();
  });
});
