'use client';

import { Check, ChevronDown, Minus, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';

import { FilterChips, type ChipBlock } from './FilterChips';
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

const YEAR_MIN = 1800;
const YEAR_MAX = 2200;

function YearFilter({
  value,
  onChange,
}: {
  value: string;
  years: number[];
  onChange: (value: string) => void;
}) {
  const id = useId();

  function step(delta: number) {
    const parsed = value ? Number(value) : Number.NaN;
    const next = Number.isFinite(parsed)
      ? Math.min(YEAR_MAX, Math.max(YEAR_MIN, parsed + delta))
      : new Date().getFullYear();
    onChange(String(next));
  }

  return (
    <div className="space-y-1 text-sm">
      <label htmlFor={id} className="block text-muted-foreground">
        Год
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Уменьшить год"
          onClick={() => step(-1)}
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Все годы"
          className="text-center tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Увеличить год"
          onClick={() => step(1)}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
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
    if (value === undefined || key !== 'genre') {
      onFiltersChange({ ...filters, [key]: undefined });
      return;
    }
    const next = (filters.genre ?? []).filter((item) => item !== value);
    onFiltersChange({ ...filters, genre: next.length > 0 ? next : undefined });
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

  return (
    <section
      className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-3">
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
          <span className="block text-muted-foreground">Название</span>
          <Input
            value={filters.title ?? ''}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, Начало"
          />
        </label>

        <GenreDropdown genres={genres} selected={genreSelected} onToggle={toggleGenre} />

        <YearFilter value={filters.year ?? ''} years={years} onChange={setYear} />
      </div>

      <FilterChips blocks={blocks} onRemove={removeFilter} onReset={resetAll} />
    </section>
  );
}
