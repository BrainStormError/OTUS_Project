'use client';

import { Button } from '@/components/ui/button';

export default function DirectoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="space-y-2">
      <p className="text-sm text-destructive">
        Не удалось загрузить справочник.
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Повторить
      </Button>
    </div>
  );
}
