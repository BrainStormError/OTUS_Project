import * as React from 'react';

import { Button } from './button';
import { cn } from './utils';

export function ErrorState({
  message,
  retry,
  className,
}: {
  message: string;
  retry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-4',
        className,
      )}
    >
      <p className="text-sm text-destructive">{message}</p>
      {retry ? (
        <Button variant="outline" size="sm" onClick={retry}>
          Повторить
        </Button>
      ) : null}
    </div>
  );
}
