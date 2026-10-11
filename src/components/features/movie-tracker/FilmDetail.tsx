'use client';

import { Bookmark, Check, Film, Star } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

import { RatingForm, type RatingPayload } from './RatingForm';
import { deleteRemoteRecord, saveRemoteRating } from './report-rating';
import { deleteRemoteWatchlist, saveRemoteWatchlist } from './report-watchlist';
import type { Movie, WatchedRecord } from './types';

export function FilmDetail({
  movie,
  initialRecord = null,
  initialWatchlistId = null,
}: {
  movie: Movie;
  initialRecord?: WatchedRecord | null;
  initialWatchlistId?: number | null;
}) {
  const [record, setRecord] = useState<WatchedRecord | null>(initialRecord);
  const [watchlistId, setWatchlistId] = useState<number | null>(initialWatchlistId);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const watched = Boolean(record);
  const planned = watchlistId !== null;
  const poster = movie.posterUrl ?? null;
  const isSeries = movie.kind === 'series';

  async function handleSave(payload: RatingPayload) {
    const previous = record;
    setRecord({
      id: record?.id ?? movie.tmdbId,
      movie,
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    });
    setOpen(false);
    setWatchlistId(null);
    try {
      const id = await saveRemoteRating({
        mediaKind: movie.kind,
        mediaRef: String(movie.tmdbId),
        rating: payload.rating,
        comment: payload.comment,
        watchedAt: payload.watchedAt,
      });
      if (id === null) {
        setRecord(previous);
        toast.error('Не удалось сохранить запись');
        return;
      }
      toast.success('Запись сохранена');
    } catch {
      setRecord(previous);
      toast.error('Не удалось сохранить запись');
    }
  }

  async function togglePlanned() {
    if (watched) {
      return;
    }
    if (planned && watchlistId !== null) {
      const previous = watchlistId;
      setWatchlistId(null);
      try {
        const ok = await deleteRemoteWatchlist(previous);
        if (ok) {
          toast.success('Удалено из «Буду смотреть»');
          return;
        }
        setWatchlistId(previous);
        toast.error('Не удалось удалить запись');
      } catch {
        setWatchlistId(previous);
        toast.error('Не удалось удалить запись');
      }
      return;
    }
    try {
      const id = await saveRemoteWatchlist({
        mediaKind: movie.kind,
        mediaRef: String(movie.tmdbId),
      });
      if (id === null) {
        toast.error('Не удалось добавить в «Буду смотреть»');
        return;
      }
      setWatchlistId(id);
      toast.success('Добавлено в «Буду смотреть»');
    } catch {
      toast.error('Не удалось добавить в «Буду смотреть»');
    }
  }

  async function unwatch() {
    const previous = record;
    if (!previous) {
      return;
    }
    setRecord(null);
    try {
      const ok = await deleteRemoteRecord(previous.id);
      if (ok) {
        toast.success('Запись удалена');
        return;
      }
      setRecord(previous);
      toast.error('Не удалось удалить запись');
    } catch {
      setRecord(previous);
      toast.error('Не удалось удалить запись');
    }
  }

  return (
    <>
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
              className="min-w-0"
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
            <Button
              type="button"
              variant={planned ? 'secondary' : 'outline'}
              aria-pressed={planned}
              aria-label="Буду смотреть"
              disabled={watched}
              onClick={() => void togglePlanned()}
              className="min-w-0"
            >
              <Bookmark
                aria-hidden="true"
                className={planned ? 'mr-1 h-4 w-4 fill-current' : 'mr-1 h-4 w-4'}
              />
              Буду смотреть
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
              className="min-w-0"
            >
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
    </>
  );
}
