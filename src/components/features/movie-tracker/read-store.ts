'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; code?: number }
  | { status: 'ready'; data: T };

type Listener = () => void;

type Entry = {
  state: Loadable<unknown>;
  listeners: Set<Listener>;
  loaded: boolean;
  inflight: Promise<void> | null;
};

const LOADING: Loadable<unknown> = { status: 'loading' };

const entries = new Map<string, Entry>();
const combos = new Map<string, { inputs: Loadable<unknown>[]; output: Loadable<unknown> }>();

function entryFor(url: string): Entry {
  let entry = entries.get(url);
  if (!entry) {
    entry = { state: LOADING, listeners: new Set(), loaded: false, inflight: null };
    entries.set(url, entry);
  }
  return entry;
}

function emit(entry: Entry): void {
  for (const listener of entry.listeners) {
    listener();
  }
}

function setState(url: string, state: Loadable<unknown>): void {
  const entry = entryFor(url);
  entry.state = state;
  if (state.status !== 'loading') {
    entry.loaded = true;
    entry.inflight = null;
  }
  emit(entry);
}

async function fetchRead(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as unknown;
}

function codeOf(error: unknown): number | undefined {
  return (error as (Error & { status?: number }) | undefined)?.status;
}

function startLoad(url: string, force: boolean): Promise<void> {
  const entry = entryFor(url);
  if (entry.inflight) {
    return entry.inflight;
  }
  if (entry.loaded && !force) {
    return Promise.resolve();
  }
  entry.state = LOADING;
  entry.inflight = fetchRead(url)
    .then((data) => {
      setState(url, { status: 'ready', data });
    })
    .catch((error: unknown) => {
      setState(url, { status: 'error', code: codeOf(error) });
    });
  emit(entry);
  return entry.inflight;
}

// Loads a read once per session. Later calls reuse the loaded state; a failed
// load stays failed until retryRead re-fetches it.
export function loadRead(url: string): Promise<void> {
  return startLoad(url, false);
}

export function retryRead(url: string): Promise<void> {
  return startLoad(url, true);
}

// Replaces the loaded state with data fetched elsewhere (the invalidation
// helper re-fetches with cache reload and feeds the result here).
export function storeRead(url: string, data: unknown): void {
  setState(url, { status: 'ready', data });
}

export function subscribeRead(url: string, listener: Listener): () => void {
  const entry = entryFor(url);
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

export function getReadState<T>(url: string): Loadable<T> {
  const entry = entries.get(url);
  return (entry ? entry.state : LOADING) as Loadable<T>;
}

function combine(states: Loadable<unknown>[]): Loadable<unknown> {
  let data: unknown[] = [];
  for (const state of states) {
    if (state.status === 'error') {
      return { status: 'error', code: state.code };
    }
    if (state.status === 'loading') {
      return LOADING;
    }
    data.push(state.data);
  }
  return { status: 'ready', data };
}

function combinedState(key: string, urls: readonly string[]): Loadable<unknown> {
  const inputs = urls.map((url) => getReadState(url));
  const cached = combos.get(key);
  if (
    cached &&
    cached.inputs.length === inputs.length &&
    cached.inputs.every((state, index) => state === inputs[index])
  ) {
    return cached.output;
  }
  const output = combine(inputs);
  combos.set(key, { inputs, output });
  return output;
}

export function resetReadStore(): void {
  entries.clear();
  combos.clear();
}

export type Readable<T> = Loadable<T> & { retry: () => void };

function withRetry<T>(state: Loadable<T>, retry: () => void): Readable<T> {
  return { ...state, retry };
}

// The screen reads a stored resource instead of fetching it on mount: the
// first load in the session fetches, every later mount renders from the store.
export function useRead<T>(url: string): Readable<T> {
  const subscribe = useCallback((listener: Listener) => subscribeRead(url, listener), [url]);
  const getSnapshot = useCallback(() => getReadState<T>(url), [url]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void loadRead(url);
  }, [url]);

  const retry = useCallback(() => {
    void retryRead(url);
  }, [url]);

  return useMemo(() => withRetry(state, retry), [state, retry]);
}

export function useReadAll<T extends readonly unknown[]>(urls: readonly string[]): Readable<T> {
  const key = urls.join('\n');
  const list = useMemo(() => (key.length > 0 ? key.split('\n') : []), [key]);

  const subscribe = useCallback(
    (listener: Listener) => {
      const unsubscribes = list.map((url) => subscribeRead(url, listener));
      return () => {
        for (const unsubscribe of unsubscribes) {
          unsubscribe();
        }
      };
    },
    [list],
  );
  const getSnapshot = useCallback(() => combinedState(key, list) as Loadable<T>, [key, list]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    for (const url of list) {
      void loadRead(url);
    }
  }, [list]);

  const retry = useCallback(() => {
    for (const url of list) {
      void retryRead(url);
    }
  }, [list]);

  return useMemo(() => withRetry(state, retry), [state, retry]);
}
