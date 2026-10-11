'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { CatalogSearchResult } from '@/modules/catalog';

import { genreOptionsFromCatalog, toMovie } from './catalog-view';
import { SearchField } from './SearchField';
import type { FilterOption, MediaKind, Movie, SearchFilters } from './types';

type SearchState = {
  status: 'idle' | 'loading' | 'error' | 'done';
  items: CatalogSearchResult[];
  page: number;
  hasMore: boolean;
};

const IDLE: SearchState = { status: 'idle', items: [], page: 1, hasMore: false };

export function AddRecordModal({
  open,
  kind,
  watchedRefs,
  onClose,
  onSelect,
}: {
  open: boolean;
  kind: MediaKind;
  watchedRefs: string[];
  onClose: () => void;
  onSelect: (movie: Movie) => void;
}) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [submitted, setSubmitted] = useState<SearchFilters>({});
  const [state, setState] = useState<SearchState>(IDLE);
  const [genres, setGenres] = useState<FilterOption[]>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void fetch(`/api/genres?kind=${kind}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { items?: { id: number; name: string }[] } | null) => {
        if (active && data?.items) {
          setGenres(genreOptionsFromCatalog(data.items));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, kind]);

  function keepSelectable(item: CatalogSearchResult): boolean {
    const watched = new Set(watchedRefs);
    return !watched.has(item.externalId) && !watched.has(`${kind}:${item.externalId}`);
  }

  async function loadPage(active: SearchFilters, page: number) {
    const append = page > 1;
    setState((previous) =>
      append && previous.status === 'done' ? previous : { ...IDLE, status: 'loading', page },
    );
    try {
      const params = new URLSearchParams({ kind, page: String(page) });
      if (active.title) params.set('q', active.title);
      if (active.genre?.length) params.set('genre', active.genre.join(','));
      if (active.yearFrom) params.set('yearFrom', active.yearFrom);
      if (active.yearTo) params.set('yearTo', active.yearTo);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        setState({ ...IDLE, status: 'error' });
        return;
      }
      const data = (await response.json()) as {
        items?: CatalogSearchResult[];
        page?: number;
        hasMore?: boolean;
      };
      const items = (data.items ?? []).filter(keepSelectable);
      setState((previous) => ({
        status: 'done',
        items: append && previous.status === 'done' ? [...previous.items, ...items] : items,
        page: data.page ?? page,
        hasMore: Boolean(data.hasMore),
      }));
    } catch {
      setState({ ...IDLE, status: 'error' });
    }
  }

  function runSearch(active: SearchFilters) {
    setSubmitted(active);
    void loadPage(active, 1);
  }

  function close() {
    setFilters({});
    setSubmitted({});
    setState(IDLE);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={kind === 'series' ? 'Добавить сериал' : 'Добавить фильм'}
      size="wide"
    >
      <div className="space-y-3">
        <SearchField
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={runSearch}
          onReset={() => setState(IDLE)}
          genres={genres}
          ariaLabel={kind === 'series' ? 'Поиск сериалов' : 'Поиск фильмов'}
        />

        {state.status === 'done' ? (
          state.items.length === 0 && !state.hasMore ? (
            <p role="status" className="text-sm text-muted-foreground">
              Ничего не найдено
            </p>
          ) : (
            <>
              <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                {state.items.map((item) => (
                  <li key={`${item.kind}:${item.externalId}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(toMovie(item))}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <span className="truncate font-medium">{item.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{item.year ?? '—'}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {state.hasMore ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadPage(submitted, state.page + 1)}
                  >
                    Показать ещё
                  </Button>
                </div>
              ) : null}
            </>
          )
        ) : null}

        {state.status === 'error' ? (
          <p role="alert" className="text-sm text-destructive">
            Не удалось выполнить поиск
          </p>
        ) : null}

        <Button type="button" variant="outline" onClick={close}>
          Отмена
        </Button>
      </div>
    </Modal>
  );
}
