import * as React from 'react';

import { cn } from './utils';

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-10 text-center',
        className,
      )}
      {...props}
    >
      <p className="text-base font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
