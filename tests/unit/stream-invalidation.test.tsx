import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedProvider } from '@/components/features/movie-tracker/feed-stream';
import {
  PERSONAL_READS,
  readsForActivity,
  readsForSignal,
  SOCIAL_READS,
  RECORDS_READS,
} from '@/components/features/movie-tracker/read-invalidation';

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

const originalEventSource: unknown = globalThis.EventSource;

let reloads: string[] = [];

function stubFetch() {
  reloads = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.cache === 'reload') {
        reloads.push(url);
      }
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
}

function reloadCount(url: string): number {
  return reloads.filter((entry) => entry === url).length;
}

beforeEach(() => {
  FakeEventSource.instances = [];
  (globalThis as unknown as { EventSource: typeof FakeEventSource }).EventSource = FakeEventSource;
  stubFetch();
});

afterEach(() => {
  if (originalEventSource === undefined) {
    delete (globalThis as unknown as { EventSource?: unknown }).EventSource;
  } else {
    (globalThis as unknown as { EventSource?: unknown }).EventSource = originalEventSource;
  }
  vi.unstubAllGlobals();
});

describe('read recovery safety nets', () => {
  it('reloads every personal read exactly once per cold start and per online event', async () => {
    render(<FeedProvider>{null}</FeedProvider>);
    await waitFor(() => expect(reloadCount('/api/records')).toBe(1));
    for (const url of PERSONAL_READS) {
      expect(reloadCount(url)).toBe(1);
    }

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(reloadCount('/api/records')).toBe(2));
    for (const url of PERSONAL_READS) {
      expect(reloadCount(url)).toBe(2);
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    for (const url of PERSONAL_READS) {
      expect(reloadCount(url)).toBe(2);
    }
  });
});

describe('stream signals invalidate the reads they affect', () => {
  it('reloads the social lists when a relationship signal arrives', async () => {
    render(<FeedProvider>{null}</FeedProvider>);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    act(() => {
      FakeEventSource.instances[0]!.emit('signal', { kind: 'friend_removed' });
    });

    await waitFor(() => expect(reloadCount('/api/friendships')).toBe(2));
    expect(reloadCount('/api/groups')).toBe(2);
    expect(reloadCount('/api/records')).toBe(1);
  });

  it('reloads records and watch-later plus the lists on a membership signal', async () => {
    render(<FeedProvider>{null}</FeedProvider>);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    act(() => {
      FakeEventSource.instances[0]!.emit('signal', { kind: 'group_dissolved' });
    });

    await waitFor(() => expect(reloadCount('/api/records')).toBe(2));
    expect(reloadCount('/api/watchlist?kind=film')).toBe(2);
    expect(reloadCount('/api/groups')).toBe(2);
  });

  it('reloads records only for the user own rating activity', async () => {
    render(<FeedProvider>{null}</FeedProvider>);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    act(() => {
      FakeEventSource.instances[0]!.emit('activity', {
        id: 1,
        cursor: 'c',
        source: 'friend',
        sourceName: 'Мария',
        kind: 'film',
        title: 'Начало',
        rating: 8,
        createdAt: '2026-10-17T10:00:00.000Z',
        href: '/film/1',
        action: 'оценил(а)',
      });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(reloadCount('/api/records')).toBe(1);

    act(() => {
      FakeEventSource.instances[0]!.emit('activity', {
        id: 2,
        cursor: 'c2',
        source: 'you',
        sourceName: 'Вы',
        kind: 'film',
        title: 'Начало',
        rating: 9,
        createdAt: '2026-10-17T10:01:00.000Z',
        href: '/film/1',
        action: 'оценил(а)',
      });
    });

    await waitFor(() => expect(reloadCount('/api/records')).toBe(2));
  });
});

describe('readsForActivity', () => {
  it('maps rating, relationship and membership activity to the reads they affect', () => {
    expect(readsForActivity('film', 'you')).toEqual(RECORDS_READS);
    expect(readsForActivity('series', 'you')).toEqual(RECORDS_READS);
    expect(readsForActivity('film', 'friend')).toEqual([]);
    expect(readsForActivity('friendship', 'friend')).toEqual(SOCIAL_READS);
    expect(readsForActivity('group', 'you')).toEqual(readsForSignal('group_joined'));
    expect(readsForActivity('unknown', 'you')).toEqual([]);
  });
});
