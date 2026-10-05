'use client';

import { Fragment, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/components/ui/utils';

import { listMovies, movieMatches } from './data';
import type { RatingPayload } from './RatingForm';
import { RecordModal } from './RecordModal';
import { mergeWithSample, useWatchedRecords } from './record-store';
import { reportRating } from './report-rating';
import { SearchField } from './SearchField';
import type { Movie, SearchFilters, WatchedRecord } from './types';

type SortKey = 'title' | 'rating' | 'watchedAt';
type SortDirection = 'asc' | 'desc';

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; direction: SortDirection };
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded-md text-left transition-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {label}
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export function MyFilmsView() {
  const { records, removed, ready, upsert, remove } = useWatchedRecords();
  const merged = useMemo(() => mergeWithSample(records, removed), [records, removed]);
  const movieOptions = useMemo(() => merged.map((record) => record.movie), [merged]);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<WatchedRecord | null>(null);
  const [deleting, setDeleting] = useState<WatchedRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addMovie, setAddMovie] = useState<Movie | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'watchedAt',
    direction: 'desc',
  });

  const filtered = useMemo(
    () => merged.filter((record) => movieMatches(record.movie, '', filters)),
    [merged, filters],
  );

  const sorted = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === 'title') {
        return a.movie.title.localeCompare(b.movie.title) * direction;
      }
      if (sort.key === 'rating') {
        return (a.rating - b.rating) * direction;
      }
      return a.watchedAt.localeCompare(b.watchedAt) * direction;
    });
  }, [filtered, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  if (!ready) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  function saveRecord(movie: Movie, payload: RatingPayload) {
    const existing = merged.find((record) => record.movie.tmdbId === movie.tmdbId);
    upsert({
      id: existing?.id ?? `w-${movie.tmdbId}`,
      movie,
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    });
    reportRating(movie, payload);
    setEditing(null);
    setAddMovie(null);
    setAdding(false);
  }

  function deleteRecord(record: WatchedRecord) {
    remove(record);
    setDeleting(null);
    setExpandedId(null);
  }

  return (
    <div className="space-y-4">
      <SearchField movies={movieOptions} filters={filters} onFiltersChange={setFilters} />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {merged.length === 0 ? (
        <EmptyState
          title="Вы ещё не отметили ни одного фильма"
          description="Добавьте фильм, чтобы он появился здесь."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Измените запрос или сбросьте фильтры."
        />
      ) : (
        <table
          data-testid="my-films"
          className="w-full border-collapse overflow-hidden rounded-lg border border-border text-left text-sm"
        >
          <thead>
            <tr className="border-b border-border">
              <SortableHeader
                label="Название"
                sortKey="title"
                sort={sort}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Оценка"
                sortKey="rating"
                sort={sort}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Дата просмотра"
                sortKey="watchedAt"
                sort={sort}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((record) => {
              const commentId = `${record.id}-comment`;
              const expanded = expandedId === record.id;
              return (
                <Fragment key={record.id}>
                  <tr
                    onClick={() => setExpandedId(expanded ? null : record.id)}
                    className={cn(
                      'cursor-pointer transition-hover hover:bg-secondary',
                      expanded && 'bg-secondary/60',
                    )}
                  >
                    <th scope="row" className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={commentId}
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedId(expanded ? null : record.id);
                        }}
                        className="rounded-md text-left transition-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {record.movie.title}
                      </button>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {record.rating > 0 ? record.rating.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {record.watchedAt}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td
                        id={commentId}
                        colSpan={3}
                        className="px-4 pb-3 text-sm text-muted-foreground"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1">
                            {record.comment ? record.comment : 'Нет комментария'}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleting(null);
                                setEditing(record);
                              }}
                            >
                              Изменить
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditing(null);
                                setDeleting(record);
                              }}
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Добавить фильм">
        {adding ? (
          <AddRecordForm
            onSelect={(movie) => {
              setAddMovie(movie);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : null}
      </Modal>

      <RecordModal
        movie={editing?.movie ?? addMovie}
        record={editing}
        onClose={() => {
          setEditing(null);
          setAddMovie(null);
        }}
        onSubmit={saveRecord}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Удалить запись?"
      >
        <p className="text-sm text-muted-foreground">
          Запись «{deleting?.movie.title}» будет удалена из ваших фильмов.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (deleting) deleteRecord(deleting);
            }}
          >
            Удалить
          </Button>
          <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
            Отмена
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AddRecordForm({
  onSelect,
  onCancel,
}: {
  onSelect: (movie: Movie) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');

  const catalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? listMovies().filter((movie) => movieMatches(movie, q)) : listMovies();
  }, [query]);

  return (
    <div className="space-y-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Название, жанр или актёр"
        aria-label="Выбор фильма"
      />
      {catalog.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          Ничего не найдено
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {catalog.map((movie) => (
            <li key={movie.tmdbId}>
              <button
                type="button"
                onClick={() => onSelect(movie)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="truncate font-medium">{movie.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{movie.year}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" onClick={onCancel}>
        Отмена
      </Button>
    </div>
  );
}
