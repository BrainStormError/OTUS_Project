'use client';

import { Fragment, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

import type { WatchedRecord } from './types';

export type SortKey = 'title' | 'rating' | 'watchedAt';
export type SortDirection = 'asc' | 'desc';
export type SortState = { key: SortKey; direction: SortDirection };

const COLUMNS: { label: string; sortKey: SortKey }[] = [
  { label: 'Название', sortKey: 'title' },
  { label: 'Оценка', sortKey: 'rating' },
  { label: 'Дата просмотра', sortKey: 'watchedAt' },
];

const COLUMN_HIGHLIGHT = 'bg-secondary/40';

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  highlighted,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  highlighted: boolean;
}) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn('px-4 py-3 font-medium', highlighted && COLUMN_HIGHLIGHT)}
    >
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

export function RecordsTable({
  testId,
  records,
  sort,
  onSort,
  expandedId,
  onToggle,
  onEdit,
  onDelete,
}: {
  testId: string;
  records: WatchedRecord[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  expandedId: number | null;
  onToggle: (id: number) => void;
  onEdit: (record: WatchedRecord) => void;
  onDelete: (record: WatchedRecord) => void;
}) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  function handleOver(event: React.MouseEvent<HTMLTableElement>) {
    const cell = (event.target as HTMLElement).closest('th, td') as HTMLTableCellElement | null;
    if (!cell || cell.colSpan > 1) {
      setHoverCol(null);
      return;
    }
    setHoverCol(cell.cellIndex);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table
        data-testid={testId}
        className="w-full border-collapse text-left text-sm"
        onMouseOver={handleOver}
        onMouseLeave={() => setHoverCol(null)}
      >
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((column, index) => (
              <SortableHeader
                key={column.sortKey}
                label={column.label}
                sortKey={column.sortKey}
                sort={sort}
                onSort={onSort}
                highlighted={hoverCol === index}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((record) => {
            const detailId = `${record.id}-detail`;
            const expanded = expandedId === record.id;
            return (
              <Fragment key={record.id}>
                <tr
                  onClick={() => onToggle(record.id)}
                  className={cn(
                    'cursor-pointer transition-hover hover:bg-secondary',
                    expanded && 'bg-secondary/60',
                  )}
                >
                  <th
                    scope="row"
                    className={cn('px-4 py-3 font-medium', hoverCol === 0 && COLUMN_HIGHLIGHT)}
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={detailId}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggle(record.id);
                      }}
                      className="rounded-md text-left transition-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {record.movie.title}
                    </button>
                  </th>
                  <td
                    className={cn(
                      'px-4 py-3 tabular-nums text-muted-foreground',
                      hoverCol === 1 && COLUMN_HIGHLIGHT,
                    )}
                  >
                    {record.rating > 0 ? record.rating.toFixed(1) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-muted-foreground',
                      hoverCol === 2 && COLUMN_HIGHLIGHT,
                    )}
                  >
                    {record.watchedAt}
                  </td>
                </tr>
                {expanded ? (
                  <tr>
                    <td
                      id={detailId}
                      colSpan={COLUMNS.length}
                      className="px-4 pb-3 text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="min-w-0 break-words [overflow-wrap:anywhere] sm:flex-1">
                          {record.comment ? record.comment : 'Нет комментария'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(record);
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
                              onDelete(record);
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
  );
}
