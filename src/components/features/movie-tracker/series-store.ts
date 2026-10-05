import { useCallback, useEffect, useState } from 'react';

import { seriesRecords as sampleRecords } from './series-data';
import type { SeriesRecord } from './types';

export const SERIES_STORAGE_KEY = 'movie-tracker-series';
export const SERIES_REMOVED_STORAGE_KEY = 'movie-tracker-series-removed';

export function loadSeries(): SeriesRecord[] {
  try {
    const raw = window.localStorage.getItem(SERIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SeriesRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeries(records: SeriesRecord[]): void {
  try {
    window.localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage unavailable (private mode) — presentation-only demo keeps state in memory
  }
}

export function loadRemovedSeries(): string[] {
  try {
    const raw = window.localStorage.getItem(SERIES_REMOVED_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRemovedSeries(ids: string[]): void {
  try {
    window.localStorage.setItem(SERIES_REMOVED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable (private mode) — presentation-only demo keeps state in memory
  }
}

export function mergeWithSampleSeries(
  stored: SeriesRecord[],
  removed: string[] = [],
): SeriesRecord[] {
  const ids = new Set(stored.map((record) => record.series.id));
  const hidden = new Set(removed);
  return [
    ...stored,
    ...sampleRecords.filter(
      (record) => !ids.has(record.series.id) && !hidden.has(record.series.id),
    ),
  ];
}

export function useSeriesRecords() {
  const [records, setRecords] = useState<SeriesRecord[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sync from the external store (localStorage) after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadSeries());
    setRemoved(loadRemovedSeries());
    setReady(true);
  }, []);

  const persist = useCallback((next: SeriesRecord[]) => {
    setRecords(next);
    saveSeries(next);
  }, []);

  const unhide = useCallback((seriesId: string) => {
    const current = loadRemovedSeries();
    if (current.includes(seriesId)) {
      const next = current.filter((id) => id !== seriesId);
      saveRemovedSeries(next);
      setRemoved(next);
    }
  }, []);

  const upsert = useCallback(
    (record: SeriesRecord) => {
      const current = loadSeries();
      const index = current.findIndex((item) => item.series.id === record.series.id);
      if (index >= 0) {
        current[index] = { ...current[index], ...record };
      } else {
        current.push(record);
      }
      persist(current);
      unhide(record.series.id);
    },
    [persist, unhide],
  );

  const remove = useCallback(
    (record: SeriesRecord) => {
      const current = loadSeries();
      persist(current.filter((item) => item.series.id !== record.series.id));
      const hidden = loadRemovedSeries();
      if (!hidden.includes(record.series.id)) {
        const next = [...hidden, record.series.id];
        saveRemovedSeries(next);
        setRemoved(next);
      }
    },
    [persist],
  );

  return { records, removed, ready, persist, upsert, remove };
}
