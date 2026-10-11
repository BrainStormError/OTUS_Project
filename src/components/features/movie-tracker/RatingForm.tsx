'use client';

import { useId, useState } from 'react';

import { currentDateInTimeZone, useTimeFormat } from '@/components/layout/preferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type RatingPayload = {
  rating: number;
  comment?: string;
  watchedAt: string;
};

export const RATING_MIN = 0;
export const RATING_MAX = 10;
export const RATING_STEP = 0.1;

export function validateRating(raw: string): { value?: number; error?: string } {
  if (raw.trim() === '') {
    return { error: 'Укажите оценку от 0 до 10' };
  }
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value)) {
    return { error: 'Оценка должна быть числом от 0 до 10' };
  }
  if (value < RATING_MIN || value > RATING_MAX) {
    return { error: 'Оценка должна быть в диапазоне от 0 до 10' };
  }
  return { value };
}

export function RatingForm({
  initialRating,
  initialComment,
  initialDate,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
  alsoPersonal,
  onAlsoPersonalChange,
  alsoPersonalLabel = 'также добавить в мои фильмы',
}: {
  initialRating?: number;
  initialComment?: string;
  initialDate?: string;
  onSubmit?: (payload: RatingPayload) => void;
  onCancel?: () => void;
  submitLabel?: string;
  alsoPersonal?: boolean;
  onAlsoPersonalChange?: (value: boolean) => void;
  alsoPersonalLabel?: string;
}) {
  const ratingId = useId();
  const commentId = useId();
  const dateId = useId();
  const errorId = useId();

  const { timeZone } = useTimeFormat();
  const maxDate = currentDateInTimeZone(timeZone);

  const [rating, setRating] = useState(
    initialRating === undefined ? '' : String(initialRating),
  );
  const [comment, setComment] = useState(initialComment ?? '');
  const [watchedAt, setWatchedAt] = useState(initialDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateRating(rating);
    if (result.error) {
      setError(result.error);
      setSaved(false);
      return;
    }
    if (watchedAt && watchedAt > maxDate) {
      setError('Дата просмотра не может быть в будущем');
      setSaved(false);
      return;
    }
    setError(null);
    onSubmit?.({
      rating: result.value as number,
      comment: comment.trim() ? comment.trim() : undefined,
      watchedAt,
    });
    setSaved(true);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor={ratingId} className="text-sm font-medium">
          Оценка (0–10)
        </label>
        <div className="flex items-center gap-3">
          <Input
            id={ratingId}
            name="rating"
            type="number"
            inputMode="decimal"
            step={RATING_STEP}
            min={RATING_MIN}
            max={RATING_MAX}
            value={rating}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setRating(event.target.value)}
            className="max-w-32"
          />
          <input
            type="range"
            aria-label="Оценка по шкале"
            step={RATING_STEP}
            min={RATING_MIN}
            max={RATING_MAX}
            value={rating === '' ? 0 : Number(rating.replace(',', '.'))}
            onChange={(event) => setRating(event.target.value)}
            className="h-11 flex-1 accent-[var(--primary)]"
          />
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={commentId} className="text-sm font-medium">
          Комментарий (необязательно)
        </label>
        <Textarea
          id={commentId}
          name="comment"
          value={comment}
          maxLength={2000}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={dateId} className="text-sm font-medium">
          Дата просмотра
        </label>
        <Input
          id={dateId}
          name="watchedAt"
          type="date"
          max={maxDate}
          value={watchedAt}
          onChange={(event) => setWatchedAt(event.target.value)}
          className="max-w-48"
        />
      </div>

      {onAlsoPersonalChange ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="alsoPersonal"
            checked={alsoPersonal ?? false}
            onChange={(event) => onAlsoPersonalChange(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          {alsoPersonalLabel}
        </label>
      ) : null}

      {saved ? (
        <p role="status" className="text-sm text-muted-foreground">
          Сохранено
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}
