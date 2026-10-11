import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedProvider } from '@/components/features/movie-tracker/feed-stream';
import { SocialFeed } from '@/components/features/movie-tracker/SocialFeed';
import type { FeedEvent } from '@/components/features/movie-tracker/feed';
import { writeTimezone } from '@/components/layout/preferences';

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
    createdAt: '2026-08-24T00:00:00.000Z',
    href: '/film/155',
    action: 'оценил(а)',
  };
}

function stubFeed(items: FeedEvent[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    const body = url.pathname === '/api/feed' ? { items } : { items: [] };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const originalEventSource: unknown = globalThis.EventSource;

beforeEach(() => {
  window.localStorage.clear();
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
    stubFeed([event(1, 'Начало')]);
    render(
      <FeedProvider>
        <SocialFeed />
      </FeedProvider>,
    );

    expect(await screen.findByText('Начало')).toBeInTheDocument();
    const source = FakeEventSource.instances[0]!;
    expect(source.url).toBe('/api/feed/stream');

    act(() => {
      source.emit('activity', event(2, 'Матрица'));
    });

    expect(await screen.findByText('Матрица')).toBeInTheDocument();
    expect(screen.getByText(/Новые записи/)).toBeInTheDocument();
  });

  it('keeps the fetched feed when the stream errors', async () => {
    stubFeed([event(9, 'Форрест Гамп')]);
    render(
      <FeedProvider>
        <SocialFeed />
      </FeedProvider>,
    );

    expect(await screen.findByText('Форрест Гамп')).toBeInTheDocument();
    const source = FakeEventSource.instances[0]!;

    act(() => {
      source.onerror?.();
    });

    expect(screen.getByText('Форрест Гамп')).toBeInTheDocument();
    expect(screen.getByText('Обновление при подключении')).toBeInTheDocument();
  });
});

describe('SocialFeed timestamps', () => {
  it('shows the event moment in the selected timezone and format', async () => {
    writeTimezone('Europe/Moscow');
    stubFeed([event(1, 'Начало')]);
    render(
      <FeedProvider>
        <SocialFeed />
      </FeedProvider>,
    );

    expect(await screen.findByText('03:00 24.08.26')).toBeInTheDocument();
  });
});

describe('SocialFeed size control', () => {
  it('renders every loaded event in a scrollable viewport sized by the selector', async () => {
    const events = Array.from({ length: 30 }, (_, index) => event(index, `Фильм ${index}`));
    stubFeed(events);
    render(
      <FeedProvider>
        <SocialFeed />
      </FeedProvider>,
    );

    const list = await screen.findByTestId('social-feed');
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
    stubFeed([event(1, 'Начало')]);
    render(
      <FeedProvider>
        <SocialFeed />
      </FeedProvider>,
    );

    expect(await screen.findByText('Начало')).toBeInTheDocument();
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

describe('SocialFeed empty and loading states', () => {
  it('shows the empty state when there is no activity', async () => {
    stubFeed([]);
    render(
      <FeedProvider>
        <SocialFeed />
      </FeedProvider>,
    );

    expect(await screen.findByText('Пока нет активности')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('feed-skeleton')).not.toBeInTheDocument());
  });
});
