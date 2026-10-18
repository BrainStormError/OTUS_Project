'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';

import { AddRecordModal } from './AddRecordModal';
import { genreOptions, movieMatches, recordMatches } from './filters';
import type { RatingPayload } from './RatingForm';
import { useWatchedRecords } from './record-store';
import { RecordModal } from './RecordModal';
import { RecordsTable, type SortKey, type SortState } from './RecordsTable';
import { SearchField } from './SearchField';
import type { FilterOption, Movie, SearchFilters, WatchedRecord, WatchlistItem } from './types';
import { ViewTabs } from './ViewTabs';
import { WatchlistTable } from './WatchlistTable';
import { useWatchlist } from './watchlist-store';

const TABS = [
  { id: 'watched', label: 'Просмотренные' },
  { id: 'watchlist', label: 'Буду смотреть' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function MyFilmsView({
  initialRecords,
  initialWatchlist = [],
  initialGenres = [],
}: {
  initialRecords: WatchedRecord[];
  initialWatchlist?: WatchlistItem[];
  initialGenres?: FilterOption[];
}) {
  const { records: allRecords, upsert, remove } = useWatchedRecords(initialRecords);
  const {
    items: allWatchlistItems,
    remove: removeWatchlistItem,
    drop: dropWatchlistItem,
  } = useWatchlist(initialWatchlist);

  const records = useMemo(
    () => allRecords.filter((record) => record.movie.kind === 'film'),
    [allRecords],
  );
  const watchlistItems = useMemo(
    () => allWatchlistItems.filter((item) => item.movie.kind === 'film'),
    [allWatchlistItems],
  );

  const [tab, setTab] = useState<TabId>('watched');

  const movieOptions = useMemo(() => records.map((record) => record.movie), [records]);
  const genres = useMemo(() => genreOptions(movieOptions), [movieOptions]);
  const watchlistMovies = useMemo(() => watchlistItems.map((item) => item.movie), [watchlistItems]);
  const watchlistGenres = useMemo(() => genreOptions(watchlistMovies), [watchlistMovies]);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [watchlistFilters, setWatchlistFilters] = useState<SearchFilters>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<WatchedRecord | null>(null);
  const [deleting, setDeleting] = useState<WatchedRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addMovie, setAddMovie] = useState<Movie | null>(null);
  const [ratingItem, setRatingItem] = useState<WatchlistItem | null>(null);
  const [sort, setSort] = useState<SortState>({
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

  const filteredWatchlist = useMemo(
    () => watchlistItems.filter((item) => movieMatches(item.movie, watchlistFilters)),
    [watchlistItems, watchlistFilters],
  );

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
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
    dropWatchlistItem(movie);
    setEditing(null);
    setAddMovie(null);
    setAdding(false);
    setRatingItem(null);
  }

  function deleteRecord(record: WatchedRecord) {
    remove(record);
    setDeleting(null);
    setExpandedId(null);
  }

  function closeRecordModal() {
    setEditing(null);
    setAddMovie(null);
    setRatingItem(null);
  }

  return (
    <div className="space-y-4">
      <ViewTabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} ariaLabel="Мои фильмы" />

      {tab === 'watched' ? (
        <div role="tabpanel" id="panel-watched" aria-labelledby="tab-watched" className="space-y-4">
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
              title="Вы ещё не отметили ни одного фильма"
              description="Добавьте фильм, чтобы он появился здесь."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Измените запрос или сбросьте фильтры."
            />
          ) : (
            <RecordsTable
              testId="my-films"
              records={sorted}
              sort={sort}
              onSort={toggleSort}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
              onEdit={(record) => {
                setDeleting(null);
                setEditing(record);
              }}
              onDelete={(record) => {
                setEditing(null);
                setDeleting(record);
              }}
            />
          )}
        </div>
      ) : (
        <div role="tabpanel" id="panel-watchlist" aria-labelledby="tab-watchlist" className="space-y-4">
          <SearchField filters={watchlistFilters} onFiltersChange={setWatchlistFilters} genres={watchlistGenres} />

          {watchlistItems.length === 0 ? (
            <EmptyState
              title="Список «Буду смотреть» пуст"
              description="Добавьте фильм, чтобы он появился здесь."
            />
          ) : filteredWatchlist.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Измените запрос или сбросьте фильтры."
            />
          ) : (
            <WatchlistTable
              testId="my-films-watchlist"
              items={filteredWatchlist}
              onRate={(item) => setRatingItem(item)}
              onRemove={(item) => removeWatchlistItem(item)}
            />
          )}
        </div>
      )}

      <AddRecordModal
        open={adding}
        kind="film"
        genres={initialGenres}
        watchedRefs={records.map((record) => String(record.movie.tmdbId))}
        onClose={() => setAdding(false)}
        onSelect={(movie) => {
          setAddMovie(movie);
          setAdding(false);
        }}
      />

      <RecordModal
        movie={editing?.movie ?? addMovie ?? ratingItem?.movie ?? null}
        record={editing}
        onClose={closeRecordModal}
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
