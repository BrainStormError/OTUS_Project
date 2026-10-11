import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/toast';

import { mediaKey } from './catalog-view';
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

export function useWatchlist(initial: WatchlistItem[]) {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>(initial);

  // Reconcile with the server whenever the props it hands down change (for
  // example after `router.refresh()` following a mutation elsewhere). Without
  // this the local `useState` seed would keep showing the pre-mutation state.
  const signature = useMemo(() => watchlistSignature(initial), [initial]);
  useEffect(() => {
    // Intentional prop->state reconciliation: `initial` is read on purpose and
    // the effect is keyed by its content signature, not its identity.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const add = useCallback(
    (movie: Movie) => {
      const key = mediaKey(movie);
      setItems((current) =>
        current.some((item) => mediaKey(item.movie) === key)
          ? current
          : [...current, { id: movie.tmdbId, movie, addedAt: today() }],
      );

      void saveRemoteWatchlist({ mediaKind: movie.kind, mediaRef: String(movie.tmdbId) })
        .then((id) => {
          if (id === null) {
            setItems((current) => current.filter((item) => mediaKey(item.movie) !== key));
            toast.error('Не удалось добавить в «Буду смотреть»');
            return;
          }
          setItems((current) =>
            current.map((item) => (mediaKey(item.movie) === key ? { ...item, id } : item)),
          );
          router.refresh();
          toast.success('Добавлено в «Буду смотреть»');
        })
        .catch(() => {
          setItems((current) => current.filter((item) => mediaKey(item.movie) !== key));
          toast.error('Не удалось добавить в «Буду смотреть»');
        });
    },
    [router, toast],
  );

  const remove = useCallback(
    (item: WatchlistItem) => {
      const key = mediaKey(item.movie);
      setItems((current) => current.filter((entry) => mediaKey(entry.movie) !== key));
      void deleteRemoteWatchlist(item.id)
        .then((ok) => {
          if (ok) {
            router.refresh();
            toast.success('Удалено из «Буду смотреть»');
          } else {
            toast.error('Не удалось удалить запись');
          }
        })
        .catch(() => toast.error('Не удалось удалить запись'));
    },
    [router, toast],
  );

  const drop = useCallback((movie: Movie) => {
    const key = mediaKey(movie);
    setItems((current) => current.filter((item) => mediaKey(item.movie) !== key));
  }, []);

  return { items, add, remove, drop };
}
