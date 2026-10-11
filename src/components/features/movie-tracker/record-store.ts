import { useCallback, useState } from 'react';

import { useToast } from '@/components/ui/toast';

import { mediaKey } from './catalog-view';
import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import type { WatchedRecord } from './types';

export function useWatchedRecords(initial: WatchedRecord[]) {
  const toast = useToast();
  const [records, setRecords] = useState<WatchedRecord[]>(initial);

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
          toast.success('Запись сохранена');
        })
        .catch(() => toast.error('Не удалось сохранить запись'));
    },
    [toast],
  );

  const remove = useCallback(
    (record: WatchedRecord) => {
      const recordKey = mediaKey(record.movie);
      setRecords((current) => current.filter((item) => mediaKey(item.movie) !== recordKey));
      void deleteRemoteRecord(record.id)
        .then((ok) => {
          if (ok) {
            toast.success('Запись удалена');
          } else {
            toast.error('Не удалось удалить запись');
          }
        })
        .catch(() => toast.error('Не удалось удалить запись'));
    },
    [toast],
  );

  return { records, upsert, remove };
}
