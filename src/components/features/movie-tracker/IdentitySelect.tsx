'use client';

import { cn } from '@/components/ui/utils';

import { useIdentityDisplay, type IdentityDisplay } from '@/components/layout/preferences';

const OPTIONS: { value: IdentityDisplay; label: string }[] = [
  { value: 'name', label: 'Имя' },
  { value: 'tag', label: 'Тег' },
  { value: 'both', label: 'Имя и тег' },
];

export function IdentitySelect() {
  const [identity, setIdentity] = useIdentityDisplay();

  return (
    <div role="radiogroup" aria-label="Отображение имени" className="flex flex-wrap gap-3">
      {OPTIONS.map((option) => {
        const active = identity === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setIdentity(option.value)}
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
