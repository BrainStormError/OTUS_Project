import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/toast';

import { mediaKey } from './catalog-view';
import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import type { WatchedRecord } from './types';

function recordsSignature(records: WatchedRecord[]): string {
  return records
    .map((record) => `${mediaKey(record.movie)}|${record.rating}|${record.watchedAt}`)
    .sort()
    .join(';');
}

export function useWatchedRecords(initial: WatchedRecord[]) {
  const toast = useToast();
  const router = useRouter();
  const [records, setRecords] = useState<WatchedRecord[]>(initial);

  // Reconcile with the server whenever the props it hands down change (for
  // example after `router.refresh()` following a mutation elsewhere). Without
  // this the local `useState` seed would keep showing the pre-mutation state.
  const signature = useMemo(() => recordsSignature(initial), [initial]);
  useEffect(() => {
    // Intentional prop->state reconciliation: `initial` is read on purpose and
    // the effect is keyed by its content signature, not its identity.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const upsert = useCallback(
    (record: WatchedRecord) => {
      const recordKey = mediaKey(record.movie);
      setRecords((current) => {
        const index = current.findIndex((item) => mediaKey(item.movie) === recordKey);
        if (index >= 0) {
          const next = [...current];
          next[index] = { ...current[index], ...record };
          return next;
        }
        return [...current, record];
      });

      void saveRemoteRating({
        mediaKind: record.movie.kind,
        mediaRef: String(record.movie.tmdbId),
        rating: record.rating,
        comment: record.comment,
        watchedAt: record.watchedAt,
      })
        .then((id) => {
          if (id === null) {
            toast.error('Не удалось сохранить запись');
            return;
          }
          setRecords((current) =>
            current.map((item) => (mediaKey(item.movie) === recordKey ? { ...item, id } : item)),
          );
          // Invalidate the client Router Cache so list sections show the new
          // record the next time they are opened instead of a cached render.
          router.refresh();
          toast.success('Запись сохранена');
        })
        .catch(() => toast.error('Не удалось сохранить запись'));
    },
    [router, toast],
  );

  const remove = useCallback(
    (record: WatchedRecord) => {
      const recordKey = mediaKey(record.movie);
      setRecords((current) => current.filter((item) => mediaKey(item.movie) !== recordKey));
      void deleteRemoteRecord(record.id)
        .then((ok) => {
          if (ok) {
            router.refresh();
            toast.success('Запись удалена');
          } else {
            toast.error('Не удалось удалить запись');
          }
        })
        .catch(() => toast.error('Не удалось удалить запись'));
    },
    [router, toast],
  );

  return { records, upsert, remove };
}
