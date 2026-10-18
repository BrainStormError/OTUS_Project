'use client';

import { Modal } from '@/components/ui/modal';
import { currentDateInTimeZone } from '@/components/layout/preferences';

import { RatingForm, type RatingPayload } from './RatingForm';
import type { Movie, WatchedRecord } from './types';

export function RecordModal({
  movie,
  record,
  onClose,
  onSubmit,
}: {
  movie: Movie | null;
  record?: WatchedRecord | null;
  onClose: () => void;
  onSubmit: (movie: Movie, payload: RatingPayload) => void;
}) {
  return (
    <Modal
      open={Boolean(movie)}
      onClose={onClose}
      title={movie ? `Оценка «${movie.title}»` : 'Запись'}
    >
      {movie ? (
        <RatingForm
          initialRating={record && record.rating > 0 ? record.rating : undefined}
          initialComment={record?.comment}
          initialDate={record?.watchedAt ?? currentDateInTimeZone()}
          submitLabel={record ? 'Сохранить' : 'Добавить'}
          onSubmit={(payload) => onSubmit(movie, payload)}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
