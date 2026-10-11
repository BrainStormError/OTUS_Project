'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';

import { FilterChips, type ChipBlock, type ChipValue } from './FilterChips';
import type { FilterKey, FilterOption, MediaKind, SearchFilters } from './types';

const KINDS: { value: MediaKind; label: string }[] = [
  { value: 'film', label: 'Фильмы' },
  { value: 'series', label: 'Сериалы' },
];

const controlClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function GenreDropdown({
  genres,
  selected,
  onToggle,
}: {
  genres: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (bounds) {
      setRect({ top: bounds.bottom + 4, left: bounds.left, width: bounds.width });
    }
    setOpen(true);
  }

  return (
    <div className="space-y-1 text-sm">
      <label htmlFor={`${id}-trigger`} className="block text-muted-foreground">
        Жанр
      </label>
      <button
        id={`${id}-trigger`}
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
        className={cn(controlClass, 'items-center justify-between gap-2 text-left')}
      >
        <span className={cn(selected.length === 0 && 'text-muted-foreground')}>
          {selected.length === 0 ? 'Все жанры' : `Выбрано: ${selected.length}`}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>

      {open && rect
        ? createPortal(
            <div
              ref={listRef}
              role="group"
              aria-label="Жанр"
              style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
              className="animate-fade z-[60] max-h-40 space-y-1 overflow-y-auto rounded-md border border-input bg-popover p-2 text-popover-foreground elevation-raised"
            >
              {genres.length === 0 ? (
                <p className="px-1 py-1 text-xs text-muted-foreground">Нет жанров</p>
              ) : (
                genres.map((option) => {
                  const checked = selected.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex min-h-8 items-center gap-2 rounded px-1',
                        checked && 'bg-secondary',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          onToggle(option.value);
                          setOpen(false);
                        }}
                      />
                      <span className={cn(checked && 'font-medium')}>{option.label}</span>
                      {checked ? <Check aria-hidden="true" className="ml-auto h-4 w-4" /> : null}
                    </label>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function parseYear(value?: string): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function YearBound({
  hint,
  value,
  max,
  onChange,
}: {
  hint: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      aria-label={`Год (${hint})`}
      inputMode="numeric"
      max={max}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => {
        const parsed = parseYear(event.target.value);
        if (parsed !== null && parsed > max) {
          onChange(String(max));
        }
      }}
      placeholder={hint}
      className="w-full min-w-0 text-center tabular-nums"
    />
  );
}

function YearRangeFilter({
  from,
  to,
  label,
  maxYear,
  onFromChange,
  onToChange,
  className,
}: {
  from: string;
  to: string;
  label: string;
  maxYear: number;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1 text-sm', className)}>
      <span className="block text-muted-foreground">{label}</span>
      <div className="grid gap-3 sm:grid-cols-2">
        <YearBound hint="с" value={from} max={maxYear} onChange={onFromChange} />
        <YearBound hint="по" value={to} max={maxYear} onChange={onToChange} />
      </div>
    </div>
  );
}

export function SearchField({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  genres = [],
  kind,
  onKindChange,
  yearLabel = 'Год',
  className,
  ariaLabel = 'Поиск',
}: {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  genres?: FilterOption[];
  kind?: MediaKind;
  onKindChange?: (kind: MediaKind) => void;
  yearLabel?: string;
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

  function setYearFrom(value: string) {
    const parsed = parseYear(value);
    if (parsed === null) {
      onFiltersChange({ ...filters, yearFrom: undefined });
      return;
    }
    const to = parseYear(filters.yearTo);
    if (to !== null && parsed > to) {
      onFiltersChange({ ...filters, yearFrom: value, yearTo: undefined });
      return;
    }
    onFiltersChange({ ...filters, yearFrom: value });
  }

  function setYearTo(value: string) {
    onFiltersChange({ ...filters, yearTo: value || undefined });
  }

  function removeFilter(key: FilterKey, value?: string) {
    if (key === 'genre' && value !== undefined) {
      const next = (filters.genre ?? []).filter((item) => item !== value);
      onFiltersChange({ ...filters, genre: next.length > 0 ? next : undefined });
      return;
    }
    if (key === 'yearFrom' && value?.startsWith('from:')) {
      onFiltersChange({ ...filters, yearFrom: undefined });
      return;
    }
    if (key === 'yearFrom' && value?.startsWith('to:')) {
      onFiltersChange({ ...filters, yearTo: undefined });
      return;
    }
    onFiltersChange({ ...filters, [key]: undefined });
  }

  function resetAll() {
    onFiltersChange({});
    onReset?.();
  }

  const genreLabel = (value: string) => genres.find((option) => option.value === value)?.label ?? value;
  const genreSelected = filters.genre ?? [];

  const maxYear = new Date().getFullYear();

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
  if (filters.yearFrom || filters.yearTo) {
    const values: ChipValue[] = [];
    if (filters.yearFrom) {
      values.push({ value: `from:${filters.yearFrom}`, label: filters.yearFrom, prefix: 'с ' });
    }
    if (filters.yearTo) {
      values.push({ value: `to:${filters.yearTo}`, label: filters.yearTo, prefix: 'по ' });
    }
    blocks.push({ key: 'yearFrom', label: yearLabel, values });
  }

  return (
    <section
      className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Поиск</h2>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="block text-muted-foreground">Название</span>
          <Input
            value={filters.title ?? ''}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, Начало"
          />
        </label>

        <GenreDropdown genres={genres} selected={genreSelected} onToggle={toggleGenre} />

        <YearRangeFilter
          from={filters.yearFrom ?? ''}
          to={filters.yearTo ?? ''}
          label={yearLabel}
          maxYear={maxYear}
          onFromChange={setYearFrom}
          onToChange={setYearTo}
          className="sm:col-span-2"
        />
      </div>

      <FilterChips blocks={blocks} onRemove={removeFilter} onReset={resetAll} />

      {onSearch ? (
        <Button type="button" className="w-full" onClick={() => onSearch(filters)}>
          Найти
        </Button>
      ) : null}
    </section>
  );
}
