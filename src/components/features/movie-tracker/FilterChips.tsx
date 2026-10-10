'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { FilterKey } from './types';

export type ChipValue = { value: string; label: string };
export type ChipBlock = { key: FilterKey; label: string; values: ChipValue[] };

export function FilterChips({
  blocks,
  onRemove,
  onReset,
}: {
  blocks: ChipBlock[];
  onRemove: (key: FilterKey, value?: string) => void;
  onReset: () => void;
}) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Активные фильтры"
      className="flex flex-wrap items-center gap-2"
      data-testid="filter-chips"
    >
      <span className="text-xs text-muted-foreground">Фильтры:</span>
      {blocks.map((block) => (
        <div
          key={block.key}
          data-testid={`filter-block-${block.key}`}
          className="flex min-h-11 flex-wrap items-center gap-1 rounded-md border border-border bg-secondary px-3 text-sm text-secondary-foreground"
        >
          <span className="text-xs text-muted-foreground">{block.label}:</span>
          {block.values.map((value) => (
            <span key={value.value} className="inline-flex items-center gap-1">
              <span>{value.label}</span>
              <button
                type="button"
                aria-label={`Удалить фильтр ${block.label}: ${value.label}`}
                onClick={() => onRemove(block.key, block.key === 'title' ? undefined : value.value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-hover hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      ))}
      <Button type="button" variant="link" size="sm" onClick={onReset}>
        Сбросить
      </Button>
    </div>
  );
}
