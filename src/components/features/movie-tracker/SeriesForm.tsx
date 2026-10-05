'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { episodeKey } from './series';
import type { EpisodeRating, Series, SeriesMode, SeriesRecord } from './types';

function parseRating(raw: string): number | undefined {
  if (raw.trim() === '') {
    return undefined;
  }
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    return undefined;
  }
  return value;
}

type EpisodeInput = { rating: string; comment: string };

function buildEpisodeInputs(series: Series, record?: SeriesRecord | null): Record<string, EpisodeInput> {
  const initial: Record<string, EpisodeInput> = {};
  for (const season of series.seasons) {
    for (const episode of season.episodes) {
      const key = episodeKey(season.number, episode.number);
      const stored = record?.episodes?.[key];
      initial[key] = {
        rating: stored ? String(stored.rating) : '',
        comment: stored?.comment ?? '',
      };
    }
  }
  return initial;
}

export function SeriesForm({
  series,
  record,
  onSubmit,
  onCancel,
}: {
  series: Series;
  record?: SeriesRecord | null;
  onSubmit: (record: SeriesRecord) => void;
  onCancel: () => void;
}) {
  const watchedAtId = useId();
  const errorId = useId();

  const [mode, setMode] = useState<SeriesMode>(record?.mode ?? 'per-episode');
  const [seriesRating, setSeriesRating] = useState(
    record?.seriesRating !== undefined ? String(record.seriesRating) : '',
  );
  const [seriesComment, setSeriesComment] = useState(record?.seriesComment ?? '');
  const [episodes, setEpisodes] = useState<Record<string, EpisodeInput>>(() =>
    buildEpisodeInputs(series, record),
  );
  const [watchedAt, setWatchedAt] = useState(
    record?.watchedAt ?? new Date().toISOString().slice(0, 10),
  );
  const [pendingMode, setPendingMode] = useState<SeriesMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyMode(next: SeriesMode) {
    setMode(next);
    setError(null);
    if (next === 'whole') {
      setEpisodes({});
    } else {
      setSeriesRating('');
      setSeriesComment('');
    }
  }

  function chooseMode(next: SeriesMode) {
    if (next === mode) {
      return;
    }
    if (record && next !== record.mode) {
      setPendingMode(next);
      return;
    }
    applyMode(next);
  }

  function updateEpisode(key: string, patch: Partial<EpisodeInput>) {
    setEpisodes((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { rating: '', comment: '' }), ...patch },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let seriesRatingValue: number | undefined;
    let seriesCommentValue: string | undefined;
    let episodeValues: Record<string, EpisodeRating> | undefined;

    if (mode === 'whole') {
      seriesRatingValue = parseRating(seriesRating);
      if (seriesRatingValue === undefined) {
        setError('Укажите оценку сериала от 0 до 10');
        return;
      }
      seriesCommentValue = seriesComment.trim() ? seriesComment.trim() : undefined;
    } else {
      const next: Record<string, EpisodeRating> = {};
      for (const [key, value] of Object.entries(episodes)) {
        if (value.rating.trim() === '') {
          continue;
        }
        const parsed = parseRating(value.rating);
        if (parsed === undefined) {
          setError('Оценка должна быть в диапазоне от 0 до 10');
          return;
        }
        next[key] = {
          rating: parsed,
          comment: value.comment.trim() ? value.comment.trim() : undefined,
        };
      }
      if (Object.keys(next).length === 0) {
        setError('Укажите хотя бы одну оценку серии');
        return;
      }
      episodeValues = next;
    }

    setError(null);
    onSubmit({
      id: record?.id ?? `s-${series.id}`,
      series,
      mode,
      seriesRating: mode === 'whole' ? seriesRatingValue : undefined,
      seriesComment: mode === 'whole' ? seriesCommentValue : undefined,
      episodes: episodeValues,
      watchedAt,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Режим оценки</legend>
        <div role="radiogroup" aria-label="Режим оценки" className="flex flex-wrap gap-3">
          <Button
            type="button"
            role="radio"
            aria-checked={mode === 'per-episode'}
            variant={mode === 'per-episode' ? 'secondary' : 'outline'}
            onClick={() => chooseMode('per-episode')}
          >
            По сериям
          </Button>
          <Button
            type="button"
            role="radio"
            aria-checked={mode === 'whole'}
            variant={mode === 'whole' ? 'secondary' : 'outline'}
            onClick={() => chooseMode('whole')}
          >
            Целиком
          </Button>
        </div>
      </fieldset>

      {pendingMode ? (
        <div
          role="alertdialog"
          aria-label="Смена режима"
          className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3"
        >
          <p className="text-sm">
            Оценки из предыдущего режима будут удалены. Продолжить?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                applyMode(pendingMode);
                setPendingMode(null);
              }}
            >
              Сменить режим
            </Button>
            <Button type="button" variant="outline" onClick={() => setPendingMode(null)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      {mode === 'whole' ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor={`${watchedAtId}-series-rating`} className="text-sm font-medium">
              Оценка сериала (0–10)
            </label>
            <Input
              id={`${watchedAtId}-series-rating`}
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              max={10}
              value={seriesRating}
              onChange={(event) => setSeriesRating(event.target.value)}
              className="max-w-32"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${watchedAtId}-series-comment`} className="text-sm font-medium">
              Комментарий сериала (необязательно)
            </label>
            <Textarea
              id={`${watchedAtId}-series-comment`}
              value={seriesComment}
              maxLength={2000}
              onChange={(event) => setSeriesComment(event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {series.seasons.map((season) => (
            <div key={season.number} className="space-y-2">
              <h3 className="text-sm font-medium">Сезон {season.number}</h3>
              <ul className="space-y-3">
                {season.episodes.map((episode) => {
                  const key = episodeKey(season.number, episode.number);
                  const value = episodes[key] ?? { rating: '', comment: '' };
                  const label = `серии ${season.number}.${episode.number}`;
                  return (
                    <li key={key} className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Серия {season.number}.{episode.number}
                        {episode.title ? ` — ${episode.title}` : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`${watchedAtId}-${key}`} className="sr-only">
                          Оценка {label}
                        </label>
                        <Input
                          id={`${watchedAtId}-${key}`}
                          type="number"
                          inputMode="decimal"
                          step={0.1}
                          min={0}
                          max={10}
                          aria-label={`Оценка ${label}`}
                          value={value.rating}
                          onChange={(event) => updateEpisode(key, { rating: event.target.value })}
                          className="max-w-24"
                        />
                        <Input
                          aria-label={`Комментарий ${label}`}
                          value={value.comment}
                          onChange={(event) => updateEpisode(key, { comment: event.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor={watchedAtId} className="text-sm font-medium">
          Дата просмотра
        </label>
        <Input
          id={watchedAtId}
          type="date"
          value={watchedAt}
          onChange={(event) => setWatchedAt(event.target.value)}
          className="max-w-48"
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">{record ? 'Сохранить' : 'Добавить'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
