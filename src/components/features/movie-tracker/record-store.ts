import { useCallback, useEffect, useState } from 'react';

import { watchedRecords as sampleRecords } from './data';
import type { WatchedRecord } from './types';

export const RECORDS_STORAGE_KEY = 'movie-tracker-records';
export const REMOVED_STORAGE_KEY = 'movie-tracker-removed';

export function loadRecords(): WatchedRecord[] {
  try {
    const raw = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WatchedRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: WatchedRecord[]): void {
  try {
    window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage unavailable (private mode) — presentation-only demo keeps state in memory
  }
}

export function loadRemoved(): number[] {
  try {
    const raw = window.localStorage.getItem(REMOVED_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRemoved(ids: number[]): void {
  try {
    window.localStorage.setItem(REMOVED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable (private mode) — presentation-only demo keeps state in memory
  }
}

export function mergeWithSample(stored: WatchedRecord[], removed: number[] = []): WatchedRecord[] {
  const ids = new Set(stored.map((record) => record.movie.tmdbId));
  const hidden = new Set(removed);
  return [
    ...stored,
    ...sampleRecords.filter(
      (record) => !ids.has(record.movie.tmdbId) && !hidden.has(record.movie.tmdbId),
    ),
  ];
}

export function useWatchedRecords() {
  const [records, setRecords] = useState<WatchedRecord[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sync from the external store (localStorage) after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadRecords());
    setRemoved(loadRemoved());
    setReady(true);
  }, []);

  const persist = useCallback((next: WatchedRecord[]) => {
    setRecords(next);
    saveRecords(next);
  }, []);

  const unhide = useCallback((tmdbId: number) => {
    const current = loadRemoved();
    if (current.includes(tmdbId)) {
      const next = current.filter((id) => id !== tmdbId);
      saveRemoved(next);
      setRemoved(next);
    }
  }, []);

  const upsert = useCallback(
    (record: WatchedRecord) => {
      const current = loadRecords();
      const index = current.findIndex(
        (item) => item.movie.tmdbId === record.movie.tmdbId,
      );
      if (index >= 0) {
        current[index] = { ...current[index], ...record };
      } else {
        current.push(record);
      }
      persist(current);
      unhide(record.movie.tmdbId);
    },
    [persist, unhide],
  );

  const remove = useCallback(
    (record: WatchedRecord) => {
      const current = loadRecords();
      persist(current.filter((item) => item.movie.tmdbId !== record.movie.tmdbId));
      const hidden = loadRemoved();
      if (!hidden.includes(record.movie.tmdbId)) {
        const next = [...hidden, record.movie.tmdbId];
        saveRemoved(next);
        setRemoved(next);
      }
    },
    [persist],
  );

  const toggle = useCallback(
    (movie: WatchedRecord['movie'], next: boolean) => {
      const current = loadRecords();
      if (next) {
        if (!current.some((item) => item.movie.tmdbId === movie.tmdbId)) {
          current.push({
            id: `w-${movie.tmdbId}`,
            movie,
            rating: 0,
            watchedAt: new Date().toISOString().slice(0, 10),
          });
        }
        persist(current);
        unhide(movie.tmdbId);
      } else {
        const index = current.findIndex((item) => item.movie.tmdbId === movie.tmdbId);
        if (index >= 0) {
          current.splice(index, 1);
          persist(current);
        }
        const hidden = loadRemoved();
        if (!hidden.includes(movie.tmdbId)) {
          const nextHidden = [...hidden, movie.tmdbId];
          saveRemoved(nextHidden);
          setRemoved(nextHidden);
        }
      }
    },
    [persist, unhide],
  );

  return { records, removed, ready, persist, upsert, remove, toggle };
}
