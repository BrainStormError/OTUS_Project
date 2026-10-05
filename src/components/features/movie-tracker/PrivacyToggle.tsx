'use client';

import { useId, useState } from 'react';

import { cn } from '@/components/ui/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved';

export function PrivacyToggle({
  label,
  description,
  checked,
  onChange,
  saving = false,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  saving?: boolean;
  className?: string;
}) {
  const id = useId();
  const [saved, setSaved] = useState(false);

  function toggle() {
    const next = !checked;
    onChange(next);
    setSaved(false);
    window.setTimeout(() => setSaved(true), 400);
  }

  return (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
      <div className="space-y-0.5">
        <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {saving ? 'Сохранение…' : saved ? 'Сохранено' : ''}
        </span>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          onClick={toggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            checked ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-background transition-hover',
              checked ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
      </div>
    </div>
  );
}
