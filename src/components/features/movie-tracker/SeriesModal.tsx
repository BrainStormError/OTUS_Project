'use client';

import { Modal } from '@/components/ui/modal';

import { RatingForm } from './RatingForm';
import type { Series, SeriesRecord } from './types';

export function SeriesModal({
  series,
  record,
  onClose,
  onSubmit,
}: {
  series: Series | null;
  record?: SeriesRecord | null;
  onClose: () => void;
  onSubmit: (record: SeriesRecord) => void;
}) {
  return (
    <Modal
      open={Boolean(series)}
      onClose={onClose}
      title={series ? `Оценка «${series.title}»` : 'Сериал'}
    >
      {series ? (
        <RatingForm
          key={record?.id ?? series.id}
          initialRating={record?.seriesRating}
          initialComment={record?.seriesComment}
          initialDate={record?.watchedAt ?? new Date().toISOString().slice(0, 10)}
          submitLabel={record ? 'Сохранить' : 'Добавить'}
          onSubmit={(payload) =>
            onSubmit({
              id: record?.id ?? `s-${series.id}`,
              series,
              mode: 'whole',
              seriesRating: payload.rating,
              seriesComment: payload.comment,
              watchedAt: payload.watchedAt,
            })
          }
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
