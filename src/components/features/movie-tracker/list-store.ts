'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

import { mediaKey } from './catalog-view';
import type { Movie, WatchedRecord, WatchlistItem } from './types';

type Listener = () => void;

type Storable = { id: number; movie: Movie };

type Entry<T> = {
  key: string;
  item: T;
  pending: boolean;
  created: boolean;
  local: boolean;
  hidden: boolean;
};

type Slice<T> = {
  entries: Map<string, Entry<T>>;
  snapshot: T[];
  listeners: Set<Listener>;
};

export type ListHandle<T> = {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T[];
  reconcile: (incoming: T[], inScope: (item: T) => boolean) => void;
  upsert: (item: T) => { key: string; previous: T | null };
  confirmUpsert: (key: string, id: number) => { hidden: boolean };
  failUpsert: (key: string, previous: T | null) => void;
  startRemove: (key: string) => { item: T; settled: boolean } | null;
  confirmRemove: (key: string) => void;
  failRemove: (key: string, item: T) => void;
  removeLocal: (key: string) => void;
  get: (key: string) => T | null;
};

export type ActorListStore<T extends Storable> = {
  handle: (actorId: number) => ListHandle<T>;
  reset: () => void;
};

export function createActorListStore<T extends Storable>(
  same: (a: T, b: T) => boolean,
): ActorListStore<T> {
  const slices = new Map<number, Slice<T>>();
  let tempId = -1;

  function sliceFor(actorId: number): Slice<T> {
    let slice = slices.get(actorId);
    if (!slice) {
      slice = { entries: new Map(), snapshot: [], listeners: new Set() };
      slices.set(actorId, slice);
    }
    return slice;
  }

  function recompute(slice: Slice<T>): void {
    slice.snapshot = [...slice.entries.values()].filter((e) => !e.hidden).map((e) => e.item);
    for (const listener of slice.listeners) {
      listener();
    }
  }

  function handleFor(slice: Slice<T>): ListHandle<T> {
    return {
      subscribe(listener) {
        slice.listeners.add(listener);
        return () => slice.listeners.delete(listener);
      },
      getSnapshot() {
        return slice.snapshot;
      },
      reconcile(incoming, inScope) {
        const seen = new Set<string>();
        let changed = false;
        for (const item of incoming) {
          const key = mediaKey(item.movie);
          seen.add(key);
          const entry = slice.entries.get(key);
          if (!entry) {
            slice.entries.set(key, {
              key,
              item,
              pending: false,
              created: false,
              local: false,
              hidden: false,
            });
            changed = true;
            continue;
          }
          if (entry.pending || entry.hidden) {
            continue;
          }
          if (entry.local) {
            if (same(entry.item, item)) {
              entry.item = item;
              entry.local = false;
              changed = true;
            }
            continue;
          }
          if (!same(entry.item, item) || entry.item.id !== item.id) {
            entry.item = item;
            changed = true;
          }
        }
        for (const entry of [...slice.entries.values()]) {
          if (
            !seen.has(entry.key) &&
            !entry.pending &&
            !entry.local &&
            !entry.hidden &&
            inScope(entry.item)
          ) {
            slice.entries.delete(entry.key);
            changed = true;
          }
        }
        if (changed) {
          recompute(slice);
        }
      },
      upsert(item) {
        const key = mediaKey(item.movie);
        const entry = slice.entries.get(key);
        const previous = entry && !entry.hidden ? entry.item : null;
        if (entry) {
          entry.item = { ...item, id: entry.hidden ? tempId-- : entry.item.id };
          entry.pending = true;
          entry.created = entry.hidden || entry.created;
          entry.local = true;
          entry.hidden = false;
          recompute(slice);
          return { key, previous };
        }
        slice.entries.set(key, {
          key,
          item: { ...item, id: tempId-- },
          pending: true,
          created: true,
          local: true,
          hidden: false,
        });
        recompute(slice);
        return { key, previous: null };
      },
      confirmUpsert(key, id) {
        const entry = slice.entries.get(key);
        if (!entry) {
          return { hidden: false };
        }
        entry.item = { ...entry.item, id };
        entry.pending = false;
        entry.created = false;
        recompute(slice);
        return { hidden: entry.hidden };
      },
      failUpsert(key, previous) {
        const entry = slice.entries.get(key);
        if (!entry) {
          return;
        }
        if (!previous) {
          slice.entries.delete(key);
        } else {
          entry.item = previous;
          entry.pending = false;
          entry.created = false;
          entry.hidden = false;
          entry.local = true;
        }
        recompute(slice);
      },
      startRemove(key) {
        const entry = slice.entries.get(key);
        if (!entry || entry.hidden) {
          return null;
        }
        const item = entry.item;
        const settled = !entry.created;
        entry.hidden = true;
        if (settled) {
          entry.pending = true;
        }
        recompute(slice);
        return { item, settled };
      },
      confirmRemove(key) {
        slice.entries.delete(key);
        recompute(slice);
      },
      failRemove(key, item) {
        slice.entries.set(key, {
          key,
          item,
          pending: false,
          created: false,
          local: true,
          hidden: false,
        });
        recompute(slice);
      },
      removeLocal(key) {
        slice.entries.delete(key);
        recompute(slice);
      },
      get(key) {
        const entry = slice.entries.get(key);
        return entry && !entry.hidden ? entry.item : null;
      },
    };
  }

  return {
    handle(actorId) {
      return handleFor(sliceFor(actorId));
    },
    reset() {
      slices.clear();
    },
  };
}

export const recordsStore = createActorListStore<WatchedRecord>(
  (a, b) =>
    a.rating === b.rating &&
    a.watchedAt === b.watchedAt &&
    (a.comment ?? '') === (b.comment ?? ''),
);

export const watchlistStore = createActorListStore<WatchlistItem>(() => true);

const ActorContext = createContext<number>(0);

export function ListStoreProvider({
  actorId,
  children,
}: {
  actorId: number;
  children: ReactNode;
}) {
  return createElement(ActorContext.Provider, { value: actorId }, children);
}

export function useListActorId(): number {
  return useContext(ActorContext);
}

export function useListHandle<T extends Storable>(
  store: ActorListStore<T>,
  actorId: number,
): ListHandle<T> {
  return useMemo(() => store.handle(actorId), [store, actorId]);
}

export function useListItems<T extends Storable>(handle: ListHandle<T>): T[] {
  return useSyncExternalStore(handle.subscribe, handle.getSnapshot, handle.getSnapshot);
}

export function useKindScope<T extends { movie: Movie }>(
  incoming: T[],
): (item: T) => boolean {
  const kinds = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const item of incoming) {
      kinds.current.add(item.movie.kind);
    }
  }, [incoming]);
  return useCallback((item: T) => kinds.current.has(item.movie.kind), []);
}

export function useKeyScope(key: string): (item: { movie: Movie }) => boolean {
  return useCallback((item) => mediaKey(item.movie) === key, [key]);
}

export function useReconcileOnSignature(
  signature: string,
  reconcile: () => void,
): void {
  useEffect(() => {
    reconcile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

export function resetListStores(): void {
  recordsStore.reset();
  watchlistStore.reset();
}
