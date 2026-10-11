'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { FeedEvent } from './feed';

export const RETRY_BASE_MS = 1_000;
export const RETRY_MAX_MS = 30_000;

// Exponentially increasing delay with bounded jitter. Repeated failures thus
// spread out instead of producing a burst of reconnects, so the client stays
// under the server's connection allowance (and treats a 429 refusal as a pause).
export function nextRetryDelay(attempt: number, random: () => number = Math.random): number {
  const exponential = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** Math.max(0, attempt));
  const jitter = Math.floor(exponential * 0.25 * random());
  return exponential + jitter;
}

type FeedStream = {
  events: FeedEvent[];
  connected: boolean;
  loading: boolean;
  pending: number;
  markSeen: () => void;
};

const FeedContext = createContext<FeedStream>({
  events: [],
  connected: false,
  loading: false,
  pending: 0,
  markSeen: () => undefined,
});

export function useFeed(): FeedStream {
  return useContext(FeedContext);
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let wasConnected = false;

    // Full feed fetch is reserved for establishing the initial data and for
    // catching up after a dropped connection, never for every reconnect error.
    const refetch = async () => {
      try {
        const response = await fetch('/api/feed');
        if (!response.ok) return;
        const data = (await response.json()) as { items?: FeedEvent[] };
        if (!cancelled && Array.isArray(data.items)) {
          setEvents(data.items);
          setPending(0);
        }
      } catch {
        // Keep the last known feed until the next successful refresh.
      }
    };

    const connect = () => {
      if (cancelled) return;
      if (typeof EventSource === 'undefined') {
        return;
      }
      const next = new EventSource('/api/feed/stream');
      source = next;
      next.addEventListener('activity', (event) => {
        try {
          const incoming = JSON.parse((event as MessageEvent).data) as FeedEvent;
          if (cancelled) return;
          setEvents((previous) =>
            previous.some((item) => item.id === incoming.id) ? previous : [incoming, ...previous],
          );
          setPending((count) => count + 1);
        } catch {
          // Ignore malformed payloads.
        }
      });
      next.onopen = () => {
        attempt = 0;
        wasConnected = true;
        setConnected(true);
      };
      next.onerror = () => {
        setConnected(false);
        next.close();
        source = null;
        if (cancelled) return;
        const dropped = wasConnected;
        wasConnected = false;
        if (dropped) {
          void refetch();
        }
        const delay = nextRetryDelay(attempt);
        attempt += 1;
        retry = setTimeout(connect, delay);
      };
    };

    void refetch().finally(() => {
      if (!cancelled) setLoading(false);
    });
    connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      source?.close();
    };
  }, []);

  const markSeen = useCallback(() => setPending(0), []);
  const value = useMemo(
    () => ({ events, connected, loading, pending, markSeen }),
    [events, connected, loading, pending, markSeen],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}
