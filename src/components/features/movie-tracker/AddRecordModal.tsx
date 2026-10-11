'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { CatalogSearchResult } from '@/modules/catalog';

import { deriveCatalogOptions, genreOptionsFromCatalog, toMovie, type CatalogOptions } from './catalog-view';
import { SearchField } from './SearchField';
import type { MediaKind, Movie, SearchFilters } from './types';

type SearchState = { status: 'idle' | 'loading' | 'error' | 'done'; items: CatalogSearchResult[] };

const EMPTY_OPTIONS: CatalogOptions = { genres: [], years: [] };

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
  const [state, setState] = useState<SearchState>({ status: 'idle', items: [] });
  const [options, setOptions] = useState<CatalogOptions>(EMPTY_OPTIONS);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void Promise.all([
      fetch('/api/genres').then((response) => (response.ok ? response.json() : null)),
      fetch(`/api/search?kind=${kind}`).then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([genreData, searchData]) => {
        if (!active) return;
        setOptions({
          genres: genreData?.items ? genreOptionsFromCatalog(genreData.items) : [],
          years: searchData?.items ? deriveCatalogOptions(searchData.items).years : [],
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, kind]);

  async function runSearch(active: SearchFilters) {
    setState({ status: 'loading', items: [] });
    try {
      const params = new URLSearchParams({ kind });
      if (active.title) params.set('q', active.title);
      if (active.genre?.length) params.set('genre', active.genre.join(','));
      if (active.year) params.set('year', active.year);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        setState({ status: 'error', items: [] });
        return;
      }
      const data = (await response.json()) as { items?: CatalogSearchResult[] };
      let items = data.items ?? [];
      const watched = new Set(watchedRefs);
      items = items.filter(
        (item) => !watched.has(item.externalId) && !watched.has(`${kind}:${item.externalId}`),
      );
      setState({ status: 'done', items });
    } catch {
      setState({ status: 'error', items: [] });
    }
  }

  function close() {
    setFilters({});
    setState({ status: 'idle', items: [] });
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
          onReset={() => setState({ status: 'idle', items: [] })}
          genres={options.genres}
          years={options.years}
          ariaLabel={kind === 'series' ? 'Поиск сериалов' : 'Поиск фильмов'}
        />

        {state.status === 'done' ? (
          state.items.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground">
              Ничего не найдено
            </p>
          ) : (
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
