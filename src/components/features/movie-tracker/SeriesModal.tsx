'use client';

import { Modal } from '@/components/ui/modal';

import { SeriesForm } from './SeriesForm';
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
        <SeriesForm
          key={record?.id ?? series.id}
          series={series}
          record={record}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
