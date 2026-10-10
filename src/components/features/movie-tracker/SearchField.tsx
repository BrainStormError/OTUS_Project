'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';

import { FilterChips, type ChipBlock } from './FilterChips';
import type { FilterKey, FilterOption, MediaKind, SearchFilters } from './types';

const KINDS: { value: MediaKind; label: string }[] = [
  { value: 'film', label: 'Фильмы' },
  { value: 'series', label: 'Сериалы' },
];

const selectClass =
  'flex min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function SearchField({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  genres = [],
  years = [],
  kind,
  onKindChange,
  className,
  ariaLabel = 'Поиск',
}: {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  genres?: FilterOption[];
  years?: number[];
  kind?: MediaKind;
  onKindChange?: (kind: MediaKind) => void;
  className?: string;
  ariaLabel?: string;
}) {
  function setTitle(value: string) {
    onFiltersChange({ ...filters, title: value || undefined });
  }

  function toggleGenre(value: string) {
    const current = filters.genre ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, genre: next.length > 0 ? next : undefined });
  }

  function setYear(value: string) {
    onFiltersChange({ ...filters, year: value || undefined });
  }

  function removeFilter(key: FilterKey, value?: string) {
    if (value === undefined) {
      onFiltersChange({ ...filters, [key]: undefined });
      return;
    }
    if (key === 'genre') {
      const next = (filters.genre ?? []).filter((item) => item !== value);
      onFiltersChange({ ...filters, genre: next.length > 0 ? next : undefined });
    }
  }

  function resetAll() {
    onFiltersChange({});
    onReset?.();
  }

  const genreLabel = (value: string) => genres.find((option) => option.value === value)?.label ?? value;
  const genreSelected = filters.genre ?? [];

  const blocks: ChipBlock[] = [];
  if (filters.title) {
    blocks.push({ key: 'title', label: 'Название', values: [{ value: filters.title, label: filters.title }] });
  }
  if (genreSelected.length > 0) {
    blocks.push({
      key: 'genre',
      label: 'Жанр',
      values: genreSelected.map((value) => ({ value, label: genreLabel(value) })),
    });
  }
  if (filters.year) {
    blocks.push({ key: 'year', label: 'Год', values: [{ value: filters.year, label: filters.year }] });
  }

  const optionListClass =
    'absolute z-20 mt-1 max-h-40 w-full space-y-1 overflow-y-auto rounded-md border border-input bg-popover p-2 text-popover-foreground shadow-md';

  return (
    <section
      className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)}
      aria-label={ariaLabel}
    >
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Поиск</h2>
        {onSearch ? (
          <Button type="button" onClick={() => onSearch(filters)}>
            Найти
          </Button>
        ) : null}
      </div>

      {onKindChange ? (
        <div role="group" aria-label="Тип" className="flex gap-2">
          {KINDS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={kind === option.value ? 'default' : 'outline'}
              aria-pressed={kind === option.value}
              onClick={() => onKindChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Название</span>
          <Input
            value={filters.title ?? ''}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, Начало"
          />
        </label>

        <details className="relative text-sm">
          <summary
            className={cn(selectClass, 'cursor-pointer list-none items-center justify-between gap-2 text-muted-foreground [&::-webkit-details-marker]:hidden')}
          >
            <span>Жанр</span>
            <span className="flex items-center gap-1">
              {genreSelected.length > 0 ? (
                <span className="rounded-full bg-secondary px-2 text-xs tabular-nums text-secondary-foreground">
                  {genreSelected.length}
                </span>
              ) : null}
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </span>
          </summary>
          <div role="group" aria-label="Жанр" className={optionListClass}>
            {genres.length === 0 ? (
              <p className="px-1 py-1 text-xs text-muted-foreground">Нет жанров</p>
            ) : (
              genres.map((option) => (
                <label key={option.value} className="flex min-h-8 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={genreSelected.includes(option.value)}
                    onChange={() => toggleGenre(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
        </details>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Год</span>
          <select
            value={filters.year ?? ''}
            onChange={(event) => setYear(event.target.value)}
            className={selectClass}
          >
            <option value="">Все годы</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FilterChips blocks={blocks} onRemove={removeFilter} onReset={resetAll} />
    </section>
  );
}
