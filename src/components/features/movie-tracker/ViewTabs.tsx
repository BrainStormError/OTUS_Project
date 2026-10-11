'use client';

import { cn } from '@/components/ui/utils';

export type ViewTab = {
  id: string;
  label: string;
};

export function ViewTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: readonly ViewTab[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel}>
      <ul role="tablist" className="-mb-px flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <li key={tab.id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  selected
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
