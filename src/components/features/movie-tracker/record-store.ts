import { useCallback, useState } from 'react';

import { mediaKey } from './catalog-view';
import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import type { WatchedRecord } from './types';

export function useWatchedRecords(initial: WatchedRecord[]) {
  const [records, setRecords] = useState<WatchedRecord[]>(initial);

  const upsert = useCallback((record: WatchedRecord) => {
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
          return;
        }
        setRecords((current) =>
          current.map((item) => (mediaKey(item.movie) === recordKey ? { ...item, id } : item)),
        );
      })
      .catch(() => undefined);
  }, []);

  const remove = useCallback((record: WatchedRecord) => {
    const recordKey = mediaKey(record.movie);
    setRecords((current) => current.filter((item) => mediaKey(item.movie) !== recordKey));
    void deleteRemoteRecord(record.id).catch(() => undefined);
  }, []);

  return { records, upsert, remove };
}
