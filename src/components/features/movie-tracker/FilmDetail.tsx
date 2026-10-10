'use client';

import Link from 'next/link';
import { Check, Film, Star } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

import { RatingForm, type RatingPayload } from './RatingForm';
import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import type { Movie, WatchedRecord } from './types';

export function FilmDetail({
  movie,
  initialRecord = null,
}: {
  movie: Movie;
  initialRecord?: WatchedRecord | null;
}) {
  const [record, setRecord] = useState<WatchedRecord | null>(initialRecord);
  const [open, setOpen] = useState(false);

  const watched = Boolean(record);
  const poster = movie.posterUrl ?? null;
  const isSeries = movie.kind === 'series';
  const backHref = isSeries ? '/series' : '/';

  function handleSave(payload: RatingPayload) {
    setRecord({
      id: record?.id ?? movie.tmdbId,
      movie,
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    });
    void saveRemoteRating({
      mediaKind: movie.kind,
      mediaRef: String(movie.tmdbId),
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    }).catch(() => undefined);
    setOpen(false);
  }

  function unwatch() {
    if (record) {
      void deleteRemoteRecord(record.id).catch(() => undefined);
    }
    setRecord(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={backHref} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Назад к поиску
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-full max-w-[220px] shrink-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-muted">
            {poster ? (
              <img src={poster} alt={`Постер «${movie.title}»`} className="h-full w-full object-cover" />
            ) : (
              <div
                data-testid="poster-fallback"
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <Film aria-hidden="true" className="h-8 w-8" />
                <span className="text-xs">Нет постера</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {isSeries ? 'Сериал' : 'Фильм'}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{movie.title}</h1>
            <p className="text-sm text-muted-foreground">
              {movie.year ?? '—'} · внешний рейтинг{' '}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star aria-hidden="true" className="h-3.5 w-3.5 text-accent-foreground" />
                {movie.rating.toFixed(1)}
              </span>
            </p>
          </div>

          <ul className="flex flex-wrap gap-1" aria-label="Жанры">
            {movie.genres.map((genre) => (
              <li key={genre}>
                <Badge>{genre}</Badge>
              </li>
            ))}
          </ul>

          {movie.director ? (
            <p className="text-sm text-muted-foreground">
              {isSeries ? 'Создатель' : 'Режиссёр'}: {movie.director}
            </p>
          ) : null}

          {movie.overview ? (
            <p className="text-sm text-muted-foreground">{movie.overview}</p>
          ) : null}

          {record && record.rating > 0 ? (
            <Card className="space-y-1 p-3" data-testid="my-rating">
              <p className="text-sm">
                Ваша оценка:{' '}
                <span className="font-semibold tabular-nums">{record.rating.toFixed(1)}</span>
              </p>
              {record.comment ? (
                <p className="text-sm text-muted-foreground">{record.comment}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">Просмотрено: {record.watchedAt}</p>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={watched ? 'secondary' : 'default'}
              aria-pressed={watched}
              onClick={() => (watched ? unwatch() : setOpen(true))}
            >
              {watched ? (
                <>
                  <Check aria-hidden="true" className="mr-1 h-4 w-4" />
                  Просмотрено
                </>
              ) : (
                'Отметить просмотренным'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
              {record && record.rating > 0 ? 'Изменить оценку' : 'Оценить'}
            </Button>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Оценка «${movie.title}»`}>
        <RatingForm
          initialRating={record?.rating && record.rating > 0 ? record.rating : undefined}
          initialComment={record?.comment}
          initialDate={record?.watchedAt}
          onSubmit={handleSave}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}
