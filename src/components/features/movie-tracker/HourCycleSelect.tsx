'use client';

import { cn } from '@/components/ui/utils';

import { useTimeFormat } from '@/components/layout/preferences';

const OPTIONS = [
  { value: false, label: '24 часа' },
  { value: true, label: '12 часов' },
];

export function HourCycleSelect() {
  const { hour12, setHourCycle } = useTimeFormat();

  return (
    <div role="radiogroup" aria-label="Формат часов" className="flex flex-wrap gap-3">
      {OPTIONS.map((option) => {
        const active = hour12 === option.value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setHourCycle(option.value)}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-4 text-sm transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'border-primary bg-secondary text-secondary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
