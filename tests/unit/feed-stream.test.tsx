import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedProvider, nextRetryDelay, useFeed } from '@/components/features/movie-tracker/feed-stream';

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

function Probe() {
  const { events, connected } = useFeed();
  return (
    <div
      data-testid="probe"
      data-count={events.length}
      data-connected={String(connected)}
    />
  );
}

const originalEventSource: unknown = globalThis.EventSource;

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

beforeEach(() => {
  FakeEventSource.instances = [];
  (globalThis as unknown as { EventSource: typeof FakeEventSource }).EventSource =
    FakeEventSource;
  stubFetch();
});

afterEach(() => {
  if (originalEventSource === undefined) {
    delete (globalThis as unknown as { EventSource?: unknown }).EventSource;
  } else {
    (globalThis as unknown as { EventSource?: unknown }).EventSource = originalEventSource;
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('nextRetryDelay', () => {
  it('grows the delay and caps it', () => {
    const noJitter = () => 0;
    expect(nextRetryDelay(0, noJitter)).toBe(1_000);
    expect(nextRetryDelay(1, noJitter)).toBe(2_000);
    expect(nextRetryDelay(2, noJitter)).toBe(4_000);
    expect(nextRetryDelay(10, noJitter)).toBe(30_000);
  });

  it('adds bounded jitter on top of the delay', () => {
    expect(nextRetryDelay(3, () => 0)).toBe(8_000);
    expect(nextRetryDelay(3, () => 1)).toBe(10_000);
  });
});

describe('FeedProvider connection lifecycle', () => {
  it('opens a single stream per app and appends incoming activity', async () => {
    render(
      <FeedProvider>
        <Probe />
      </FeedProvider>,
    );

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]!.url).toBe('/api/feed/stream');

    act(() => {
      FakeEventSource.instances[0]!.emit('activity', { id: 1 });
    });

    await waitFor(() => expect(screen.getByTestId('probe')).toHaveAttribute('data-count', '1'));
  });

  it('keeps one connection across section changes and closes it on unmount', async () => {
    const { rerender, unmount } = render(
      <FeedProvider>
        <Probe />
      </FeedProvider>,
    );
    await act(async () => undefined);
    expect(FakeEventSource.instances).toHaveLength(1);

    rerender(
      <FeedProvider>
        <div data-testid="other-section" />
      </FeedProvider>,
    );
    expect(FakeEventSource.instances).toHaveLength(1);

    unmount();
    expect(FakeEventSource.instances[0]!.closed).toBe(true);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it('spaces repeated failed reconnects with an increasing delay', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(
      <FeedProvider>
        <Probe />
      </FeedProvider>,
    );
    await act(async () => undefined);

    expect(FakeEventSource.instances).toHaveLength(1);
    act(() => {
      FakeEventSource.instances[0]!.onerror?.();
    });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(FakeEventSource.instances).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(FakeEventSource.instances).toHaveLength(2);

    act(() => {
      FakeEventSource.instances[1]!.onerror?.();
    });
    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(FakeEventSource.instances).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(FakeEventSource.instances).toHaveLength(3);
  });

  it('stays within the server connection allowance over a minute of failures', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(
      <FeedProvider>
        <Probe />
      </FeedProvider>,
    );
    await act(async () => undefined);

    const before = FakeEventSource.instances.length;
    let elapsed = 0;
    let attempt = 0;
    while (elapsed < 60_000) {
      const current = FakeEventSource.instances.at(-1)!;
      act(() => {
        current.onerror?.();
      });
      attempt += 1;
      const delay = nextRetryDelay(attempt - 1, () => 0);
      act(() => {
        vi.advanceTimersByTime(delay);
      });
      elapsed += delay;
    }

    // CONNECT_LIMIT is 10 connections per 60s on the server.
    expect(FakeEventSource.instances.length - before).toBeLessThan(10);
  });
});
