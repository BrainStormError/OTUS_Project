import { useCallback, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/toast';

import { mediaKey } from './catalog-view';
import {
  useKeyScope,
  useKindScope,
  useListActorId,
  useListHandle,
  useListItems,
  useReconcileOnSignature,
  watchlistStore,
} from './list-store';
import type { ListHandle } from './list-store';
import { deleteRemoteWatchlist, saveRemoteWatchlist } from './report-watchlist';
import type { Movie, WatchlistItem } from './types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function watchlistSignature(items: WatchlistItem[]): string {
  return items
    .map((item) => mediaKey(item.movie))
    .sort()
    .join(';');
}

function useWatchlistMutations(handle: ListHandle<WatchlistItem>) {
  const toast = useToast();
  const router = useRouter();

  const finishDelete = useCallback(
    (key: string, item: WatchlistItem) => {
      void deleteRemoteWatchlist(item.id)
        .then((ok) => {
          if (ok) {
            handle.confirmRemove(key);
            router.refresh();
            toast.success('Удалено из «Буду смотреть»');
          } else {
            handle.failRemove(key, item);
            toast.error('Не удалось удалить запись');
          }
        })
        .catch(() => {
          handle.failRemove(key, item);
          toast.error('Не удалось удалить запись');
        });
    },
    [handle, router, toast],
  );

  const add = useCallback(
    (movie: Movie) => {
      const key = mediaKey(movie);
      if (handle.get(key)) {
        return;
      }
      const { previous } = handle.upsert({
        id: movie.tmdbId,
        movie,
        addedAt: today(),
      });
      void saveRemoteWatchlist({ mediaKind: movie.kind, mediaRef: String(movie.tmdbId) })
        .then((id) => {
          if (id === null) {
            handle.failUpsert(key, previous);
            toast.error('Не удалось добавить в «Буду смотреть»');
            return;
          }
          const { hidden } = handle.confirmUpsert(key, id);
          if (hidden) {
            finishDelete(key, { id, movie, addedAt: today() });
            return;
          }
          router.refresh();
          toast.success('Добавлено в «Буду смотреть»');
        })
        .catch(() => {
          handle.failUpsert(key, previous);
          toast.error('Не удалось добавить в «Буду смотреть»');
        });
    },
    [finishDelete, handle, router, toast],
  );

  const remove = useCallback(
    (item: WatchlistItem) => {
      const key = mediaKey(item.movie);
      const started = handle.startRemove(key);
      if (!started) {
        return;
      }
      if (!started.settled) {
        return;
      }
      finishDelete(key, started.item);
    },
    [finishDelete, handle],
  );

  return { add, remove };
}

export function useWatchlist(initial: WatchlistItem[]) {
  const actorId = useListActorId();
  const handle = useListHandle(watchlistStore, actorId);
  const items = useListItems(handle);
  const inScope = useKindScope(initial);
  const signature = useMemo(() => watchlistSignature(initial), [initial]);

  useReconcileOnSignature(signature, () => {
    handle.reconcile(initial, inScope);
  });

  const { add, remove } = useWatchlistMutations(handle);

  const drop = useCallback(
    (movie: Movie) => {
      handle.removeLocal(mediaKey(movie));
    },
    [handle],
  );

  return { items, add, remove, drop };
}

export function useWatchlistFor(movie: Movie, initialWatchlistId: number | null) {
  const actorId = useListActorId();
  const handle = useListHandle(watchlistStore, actorId);
  const items = useListItems(handle);
  const key = mediaKey(movie);
  const inScope = useKeyScope(key);
  const feed = useMemo(
    () => (initialWatchlistId === null ? [] : [{ id: initialWatchlistId, movie, addedAt: '' }]),
    [initialWatchlistId, movie],
  );
  const signature = useMemo(
    () => watchlistSignature(feed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialWatchlistId],
  );

  useReconcileOnSignature(signature, () => {
    handle.reconcile(feed, inScope);
  });

  const { add, remove } = useWatchlistMutations(handle);

  const drop = useCallback(
    (target: Movie) => {
      handle.removeLocal(mediaKey(target));
    },
    [handle],
  );

  const item = useMemo(
    () => items.find((entry) => mediaKey(entry.movie) === key) ?? null,
    [items, key],
  );

  return { item, add, remove, drop };
}
