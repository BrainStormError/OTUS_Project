import { useCallback, useState } from 'react';

import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import type { WatchedRecord } from './types';

export function useWatchedRecords(initial: WatchedRecord[]) {
  const [records, setRecords] = useState<WatchedRecord[]>(initial);

  const upsert = useCallback((record: WatchedRecord) => {
    setRecords((current) => {
      const index = current.findIndex(
        (item) => item.movie.tmdbId === record.movie.tmdbId,
      );
      if (index >= 0) {
        const next = [...current];
        next[index] = { ...current[index], ...record };
        return next;
      }
      return [...current, record];
    });

    void saveRemoteRating({
      mediaKind: 'film',
      mediaRef: String(record.movie.tmdbId),
      title: record.movie.title,
      year: record.movie.year,
      genres: record.movie.genres,
      rating: record.rating,
      comment: record.comment,
      watchedAt: record.watchedAt,
    })
      .then((id) => {
        if (id === null) {
          return;
        }
        setRecords((current) =>
          current.map((item) =>
            item.movie.tmdbId === record.movie.tmdbId ? { ...item, id } : item,
          ),
        );
      })
      .catch(() => undefined);
  }, []);

  const remove = useCallback((record: WatchedRecord) => {
    setRecords((current) =>
      current.filter((item) => item.movie.tmdbId !== record.movie.tmdbId),
    );
    void deleteRemoteRecord(record.id).catch(() => undefined);
  }, []);

  return { records, upsert, remove };
}
