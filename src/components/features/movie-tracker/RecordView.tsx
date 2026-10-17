import Link from 'next/link';
import { Star } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import type { WatchedRecord } from './types';

export function RecordView({ record }: { record: WatchedRecord | null }) {
  if (!record) {
    return (
      <EmptyState
        title="Запись не найдена"
        description="Возможно, она была удалена."
        action={
          <Link href="/films" prefetch={false} className="text-sm underline">
            К моим фильмам
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/films" prefetch={false} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Мои фильмы
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Link href={`/film/${record.movie.tmdbId}`} prefetch={false} className="underline-offset-4 hover:underline">
            {record.movie.title}
          </Link>
        </h1>
        <p className="text-sm text-muted-foreground">{record.movie.year}</p>
      </header>
      <Card className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm">
          <Star aria-hidden="true" className="h-4 w-4 text-accent-foreground" />
          Оценка:{' '}
          <span className="font-semibold tabular-nums">
            {record.rating > 0 ? record.rating.toFixed(1) : 'без оценки'}
          </span>
        </p>
        {record.comment ? (
          <p className="text-sm text-muted-foreground">{record.comment}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">Дата просмотра: {record.watchedAt}</p>
      </Card>
    </div>
  );
}
