'use client';

import { Fragment, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/components/ui/utils';

import { movieMatches } from './data';
import { episodeKey, seasonAverage, seriesAverage, seriesToMovie } from './series';
import { listSeries } from './series-data';
import { SeriesModal } from './SeriesModal';
import { useSeriesRecords } from './series-store';
import { SearchField } from './SearchField';
import type { SearchFilters, Series, SeriesRecord } from './types';

type SortKey = 'title' | 'rating' | 'watchedAt';
type SortDirection = 'asc' | 'desc';

function formatAverage(value: number | null): string {
  return value === null ? '—' : value.toFixed(1);
}

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

function Episodes({
  record,
  season,
}: {
  record: SeriesRecord;
  season: number;
}) {
  const meta = record.series.seasons.find((item) => item.number === season);
  if (!meta) {
    return null;
  }
  return (
    <ul className="space-y-1" data-testid={`episodes-${season}`}>
      {meta.episodes.map((episode) => {
        const stored = record.episodes?.[episodeKey(season, episode.number)];
        return (
          <li
            key={episode.number}
            className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
          >
            <span>
              Серия {season}.{episode.number}
              {episode.title ? ` — ${episode.title}` : ''}
            </span>
            <span className="tabular-nums">
              {stored ? stored.rating.toFixed(1) : '—'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SeriesExpansion({
  record,
  expandedSeason,
  onToggleSeason,
}: {
  record: SeriesRecord;
  expandedSeason: number | null;
  onToggleSeason: (season: number) => void;
}) {
  const seasons = record.series.seasons;

  if (record.mode === 'whole') {
    return <p className="text-sm text-muted-foreground">{record.seriesComment ?? 'Нет комментария'}</p>;
  }

  const single = seasons.length === 1 ? seasons[0] : undefined;
  if (single) {
    return <Episodes record={record} season={single.number} />;
  }

  return (
    <div className="space-y-2">
      {seasons.map((season) => {
        const open = expandedSeason === season.number;
        return (
          <div key={season.number}>
            <button
              type="button"
              aria-expanded={open}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSeason(season.number);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md text-left text-sm font-medium transition-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>Сезон {season.number}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatAverage(seasonAverage(record, season.number))}
              </span>
            </button>
            {open ? <Episodes record={record} season={season.number} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function MySeriesView({ initialRecords }: { initialRecords: SeriesRecord[] }) {
  const { records, upsert, remove } = useSeriesRecords(initialRecords);
  const options = useMemo(() => records.map((record) => seriesToMovie(record.series)), [records]);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [editing, setEditing] = useState<SeriesRecord | null>(null);
  const [deleting, setDeleting] = useState<SeriesRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addSeries, setAddSeries] = useState<Series | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'watchedAt',
    direction: 'desc',
  });

  const filtered = useMemo(
    () => records.filter((record) => movieMatches(seriesToMovie(record.series), '', filters)),
    [records, filters],
  );

  const sorted = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === 'title') {
        return a.series.title.localeCompare(b.series.title) * direction;
      }
      if (sort.key === 'rating') {
        return ((seriesAverage(a) ?? -1) - (seriesAverage(b) ?? -1)) * direction;
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

  function toggleRow(id: string) {
    setExpandedId((current) => (current === id ? null : id));
    setExpandedSeason(null);
  }

  function saveRecord(record: SeriesRecord) {
    upsert(record);
    setEditing(null);
    setAddSeries(null);
    setAdding(false);
  }

  function deleteRecord(record: SeriesRecord) {
    remove(record);
    setDeleting(null);
    setExpandedId(null);
  }

  return (
    <div className="space-y-4">
      <SearchField movies={options} filters={filters} onFiltersChange={setFilters} />

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
        <table
          data-testid="my-series"
          className="w-full border-collapse overflow-hidden rounded-lg border border-border text-left text-sm"
        >
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
                        {record.series.title}
                      </button>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatAverage(seriesAverage(record))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.watchedAt}</td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td id={detailId} colSpan={3} className="px-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <SeriesExpansion
                              record={record}
                              expandedSeason={expandedSeason}
                              onToggleSeason={(season) =>
                                setExpandedSeason((current) =>
                                  current === season ? null : season,
                                )
                              }
                            />
                          </div>
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

      <Modal open={adding} onClose={() => setAdding(false)} title="Добавить сериал">
        {adding ? (
          <AddSeriesForm
            onSelect={(series) => {
              setAddSeries(series);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : null}
      </Modal>

      <SeriesModal
        series={editing?.series ?? addSeries}
        record={editing}
        onClose={() => {
          setEditing(null);
          setAddSeries(null);
        }}
        onSubmit={saveRecord}
      />

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Удалить сериал?">
        <p className="text-sm text-muted-foreground">
          Сериал «{deleting?.series.title}» будет удалён из ваших сериалов.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (deleting) {
                deleteRecord(deleting);
              }
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

function AddSeriesForm({
  onSelect,
  onCancel,
}: {
  onSelect: (series: Series) => void;
  onCancel: () => void;
}) {
  const catalog = useMemo(() => listSeries(), []);
  const catalogMovies = useMemo(() => catalog.map(seriesToMovie), [catalog]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [committed, setCommitted] = useState<SearchFilters | null>(null);

  const visible = useMemo(() => {
    if (!committed) {
      return catalog;
    }
    return catalog.filter((series) => movieMatches(seriesToMovie(series), '', committed));
  }, [catalog, committed]);

  return (
    <div className="space-y-3">
      <SearchField
        movies={catalogMovies}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={(next) => setCommitted(next)}
        onReset={() => setCommitted(null)}
        hiddenFilters={['actor', 'director']}
        ariaLabel="Поиск сериалов"
      />
      {visible.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          Ничего не найдено
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {visible.map((series) => (
            <li key={series.id}>
              <button
                type="button"
                onClick={() => onSelect(series)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="truncate font-medium">{series.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{series.year}</span>
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
