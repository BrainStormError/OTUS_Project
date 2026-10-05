'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/components/ui/utils';

import { readTheme, writeTheme, type Theme } from '@/components/layout/preferences';

export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sync with the external theme store after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
    setReady(true);
  }, []);

  function select(next: Theme) {
    setTheme(next);
    writeTheme(next);
  }

  return (
    <div role="radiogroup" aria-label="Тема оформления" className="flex gap-3">
      {(
        [
          { value: 'light', label: 'Светлая', icon: Sun },
          { value: 'dark', label: 'Тёмная', icon: Moon },
        ] as const
      ).map((option) => {
        const Icon = option.icon;
        const active = ready && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => select(option.value)}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-4 text-sm transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'border-primary bg-secondary text-secondary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
