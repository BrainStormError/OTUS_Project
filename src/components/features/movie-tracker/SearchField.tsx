'use client';

import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';

import { FilterChips } from './FilterChips';
import type { FilterKey, Movie, SearchFilters } from './types';

type MultiFilterKey = 'genre' | 'actor' | 'director' | 'year';

export function SearchField({
  movies,
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  className,
}: {
  movies: Movie[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  className?: string;
}) {
  const genres = useMemo(
    () =>
      Array.from(new Set(movies.flatMap((movie) => movie.genres))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [movies],
  );
  const actors = useMemo(
    () =>
      Array.from(new Set(movies.flatMap((movie) => movie.actors ?? []))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [movies],
  );
  const directors = useMemo(
    () =>
      Array.from(
        new Set(movies.map((movie) => movie.director).filter((value): value is string => Boolean(value))),
      ).sort((a, b) => a.localeCompare(b)),
    [movies],
  );
  const years = useMemo(
    () => Array.from(new Set(movies.map((movie) => movie.year))).sort((a, b) => b - a),
    [movies],
  );

  const multiFilters: { key: MultiFilterKey; label: string; options: string[] }[] = [
    { key: 'genre', label: 'Жанр', options: genres },
    { key: 'actor', label: 'Актёр', options: actors },
    { key: 'director', label: 'Режиссёр', options: directors },
    { key: 'year', label: 'Год', options: years.map(String) },
  ];

  function setTitle(value: string) {
    onFiltersChange({ ...filters, title: value || undefined });
  }

  function toggleValue(key: MultiFilterKey, value: string) {
    const current = filters[key] ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next.length > 0 ? next : undefined });
  }

  function removeFilter(key: FilterKey, value?: string) {
    if (value === undefined) {
      onFiltersChange({ ...filters, [key]: undefined });
      return;
    }
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.filter((item) => item !== value);
    onFiltersChange({ ...filters, [key]: next.length > 0 ? next : undefined });
  }

  function resetAll() {
    onFiltersChange({});
    onReset?.();
  }

  const optionListClass =
    'absolute z-20 mt-1 max-h-40 w-full space-y-1 overflow-y-auto rounded-md border border-input bg-popover p-2 text-popover-foreground shadow-md';

  return (
    <section
      className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)}
      aria-label="Поиск фильмов"
    >
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Поиск</h2>
        {onSearch ? (
          <Button type="button" onClick={() => onSearch(filters)}>
            Найти
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Название</span>
          <Input
            value={filters.title ?? ''}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, Начало"
          />
        </label>
        {multiFilters.map(({ key, label, options }) => {
          const selected = filters[key] ?? [];
          return (
            <details key={key} className="relative text-sm">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                <span>{label}</span>
                <span className="flex items-center gap-1">
                  {selected.length > 0 ? (
                    <span className="rounded-full bg-secondary px-2 text-xs tabular-nums text-secondary-foreground">
                      {selected.length}
                    </span>
                  ) : null}
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                </span>
              </summary>
              <div role="group" aria-label={label} className={optionListClass}>
                {options.map((value) => (
                  <label key={value} className="flex min-h-8 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(value)}
                      onChange={() => toggleValue(key, value)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <FilterChips filters={filters} onRemove={removeFilter} onReset={resetAll} />
    </section>
  );
}
