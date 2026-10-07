import { useCallback, useState } from 'react';

import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import { seriesAverage } from './series';
import type { SeriesRecord } from './types';

export function useSeriesRecords(initial: SeriesRecord[]) {
  const [records, setRecords] = useState<SeriesRecord[]>(initial);

  const upsert = useCallback((record: SeriesRecord) => {
    setRecords((current) => {
      const index = current.findIndex((item) => item.series.id === record.series.id);
      if (index >= 0) {
        const next = [...current];
        next[index] = { ...current[index], ...record };
        return next;
      }
      return [...current, record];
    });

    const rating = record.mode === 'whole' ? record.seriesRating : seriesAverage(record);
    if (rating === undefined || rating === null) {
      return;
    }
    void saveRemoteRating({
      mediaKind: 'series',
      mediaRef: record.series.id,
      title: record.series.title,
      year: record.series.year,
      genres: record.series.genres,
      rating,
      comment: record.seriesComment,
      watchedAt: record.watchedAt,
    })
      .then((id) => {
        if (id === null) {
          return;
        }
        setRecords((current) =>
          current.map((item) =>
            item.series.id === record.series.id ? { ...item, id: String(id) } : item,
          ),
        );
      })
      .catch(() => undefined);
  }, []);

  const remove = useCallback((record: SeriesRecord) => {
    setRecords((current) =>
      current.filter((item) => item.series.id !== record.series.id),
    );
    const ratingId = Number(record.id);
    if (Number.isInteger(ratingId) && ratingId > 0) {
      void deleteRemoteRecord(ratingId).catch(() => undefined);
    }
  }, []);

  return { records, upsert, remove };
}
