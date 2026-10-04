import { Button } from '@/components/ui/button';

export type ViewState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string; retry?: () => void }
  | { status: 'success'; data: T };

type AsyncViewProps<T> = {
  state: ViewState<T>;
  emptyMessage?: string;
  children: (data: T) => React.ReactNode;
};

export function AsyncView<T>({
  state,
  emptyMessage = 'Нет данных',
  children,
}: AsyncViewProps<T>) {
  if (state.status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="space-y-3"
        data-testid="async-loading"
      >
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (state.status === 'empty') {
    return (
      <p role="status" data-testid="async-empty" className="text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <div role="alert" data-testid="async-error" className="space-y-2">
        <p className="text-sm text-destructive">{state.message}</p>
        {state.retry ? (
          <Button variant="outline" size="sm" onClick={state.retry}>
            Повторить
          </Button>
        ) : null}
      </div>
    );
  }

  return <>{children(state.data)}</>;
}
