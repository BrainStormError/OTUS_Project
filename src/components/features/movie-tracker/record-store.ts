import { useCallback, useMemo } from 'react';

import { useToast } from '@/components/ui/toast';

import { mediaKey } from './catalog-view';
import {
  recordsStore,
  useKeyScope,
  useKindScope,
  useListActorId,
  useListHandle,
  useListItems,
  useReconcileOnSignature,
} from './list-store';
import type { ListHandle } from './list-store';
import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import type { Movie, WatchedRecord } from './types';

function recordsSignature(records: WatchedRecord[]): string {
  return records
    .map((record) => `${mediaKey(record.movie)}|${record.rating}|${record.watchedAt}|${record.comment ?? ''}`)
    .sort()
    .join(';');
}

function useRecordMutations(handle: ListHandle<WatchedRecord>) {
  const toast = useToast();

  const finishDelete = useCallback(
    (key: string, record: WatchedRecord) => {
      void deleteRemoteRecord(record.id)
        .then((ok) => {
          if (ok) {
            handle.confirmRemove(key);
            toast.success('Запись удалена');
          } else {
            handle.failRemove(key, record);
            toast.error('Не удалось удалить запись');
          }
        })
        .catch(() => {
          handle.failRemove(key, record);
          toast.error('Не удалось удалить запись');
        });
    },
    [handle, toast],
  );

  const upsert = useCallback(
    (record: WatchedRecord) => {
      const { key, previous } = handle.upsert(record);
      void saveRemoteRating({
        mediaKind: record.movie.kind,
        mediaRef: String(record.movie.tmdbId),
        rating: record.rating,
        comment: record.comment,
        watchedAt: record.watchedAt,
      })
        .then((id) => {
          if (id === null) {
            handle.failUpsert(key, previous);
            toast.error('Не удалось сохранить запись');
            return;
          }
          const { hidden } = handle.confirmUpsert(key, id);
          if (hidden) {
            finishDelete(key, { ...record, id });
            return;
          }
          toast.success('Запись сохранена');
        })
        .catch(() => {
          handle.failUpsert(key, previous);
          toast.error('Не удалось сохранить запись');
        });
    },
    [finishDelete, handle, toast],
  );

  const remove = useCallback(
    (record: WatchedRecord) => {
      const key = mediaKey(record.movie);
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

  return { upsert, remove };
}

export function useWatchedRecords(initial: WatchedRecord[]) {
  const actorId = useListActorId();
  const handle = useListHandle(recordsStore, actorId);
  const records = useListItems(handle);
  const inScope = useKindScope(initial);
  const signature = useMemo(() => recordsSignature(initial), [initial]);

  useReconcileOnSignature(signature, () => {
    handle.reconcile(initial, inScope);
  });

  const { upsert, remove } = useRecordMutations(handle);

  return { records, upsert, remove };
}

export function useWatchedRecordFor(movie: Movie, initialRecord: WatchedRecord | null) {
  const actorId = useListActorId();
  const handle = useListHandle(recordsStore, actorId);
  const records = useListItems(handle);
  const key = mediaKey(movie);
  const inScope = useKeyScope(key);
  const feed = useMemo(() => (initialRecord ? [initialRecord] : []), [initialRecord]);
  const signature = useMemo(() => recordsSignature(feed), [feed]);

  useReconcileOnSignature(signature, () => {
    handle.reconcile(feed, inScope);
  });

  const { upsert, remove } = useRecordMutations(handle);

  const record = useMemo(
    () => records.find((item) => mediaKey(item.movie) === key) ?? null,
    [records, key],
  );

  return { record, upsert, remove };
}
