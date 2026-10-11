'use client';

import { Fragment, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/components/ui/utils';

import { AddRecordModal } from './AddRecordModal';
import { genreOptions, recordMatches } from './filters';
import type { RatingPayload } from './RatingForm';
import { useWatchedRecords } from './record-store';
import { RecordModal } from './RecordModal';
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

export function MySeriesView({ initialRecords }: { initialRecords: WatchedRecord[] }) {
  const { records, upsert, remove } = useWatchedRecords(initialRecords);
  const movieOptions = useMemo(() => records.map((record) => record.movie), [records]);
  const genres = useMemo(() => genreOptions(movieOptions), [movieOptions]);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<WatchedRecord | null>(null);
  const [deleting, setDeleting] = useState<WatchedRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addSeries, setAddSeries] = useState<Movie | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'watchedAt',
    direction: 'desc',
  });

  const filtered = useMemo(
    () => records.filter((record) => recordMatches(record, filters)),
    [records, filters],
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

  function toggleRow(id: number) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function saveRecord(movie: Movie, payload: RatingPayload) {
    const existing = records.find((record) => record.movie.tmdbId === movie.tmdbId);
    upsert({
      id: existing?.id ?? movie.tmdbId,
      movie,
      rating: payload.rating,
      comment: payload.comment,
      watchedAt: payload.watchedAt,
    });
    setEditing(null);
    setAddSeries(null);
    setAdding(false);
  }

  function deleteRecord(record: WatchedRecord) {
    remove(record);
    setDeleting(null);
    setExpandedId(null);
  }

  return (
    <div className="space-y-4">
      <SearchField
        filters={filters}
        onFiltersChange={setFilters}
        genres={genres}
        yearLabel="год просмотра"
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="Вы ещё не отметили ни одного сериала"
          description="Добавьте сериал, чтобы он появился здесь."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Измените запрос или сбросьте фильтры."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table data-testid="my-series" className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <SortableHeader label="Название" sortKey="title" sort={sort} onSort={toggleSort} />
              <SortableHeader label="Оценка" sortKey="rating" sort={sort} onSort={toggleSort} />
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
              const detailId = `${record.id}-detail`;
              const expanded = expandedId === record.id;
              return (
                <Fragment key={record.id}>
                  <tr
                    onClick={() => toggleRow(record.id)}
                    className={cn(
                      'cursor-pointer transition-hover hover:bg-secondary',
                      expanded && 'bg-secondary/60',
                    )}
                  >
                    <th scope="row" className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={detailId}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleRow(record.id);
                        }}
                        className="rounded-md text-left transition-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {record.movie.title}
                      </button>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {record.rating > 0 ? record.rating.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.watchedAt}</td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td id={detailId} colSpan={3} className="px-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
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
        </div>
      )}

      <AddRecordModal
        open={adding}
        kind="series"
        watchedRefs={records.map((record) => String(record.movie.tmdbId))}
        onClose={() => setAdding(false)}
        onSelect={(movie) => {
          setAddSeries(movie);
          setAdding(false);
        }}
      />

      <RecordModal
        movie={editing?.movie ?? addSeries}
        record={editing}
        onClose={() => {
          setEditing(null);
          setAddSeries(null);
        }}
        onSubmit={saveRecord}
      />

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Удалить сериал?">
        <p className="text-sm text-muted-foreground">
          Сериал «{deleting?.movie.title}» будет удалён из ваших сериалов.
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
