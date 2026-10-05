import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

export type ViewState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string; retry?: () => void }
  | { status: 'success'; data: T };

type AsyncViewProps<T> = {
  state: ViewState<T>;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  children: (data: T) => React.ReactNode;
};

export function AsyncView<T>({
  state,
  emptyMessage = 'Нет данных',
  emptyTitle,
  emptyAction,
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
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  if (state.status === 'empty') {
    return (
      <div role="status" data-testid="async-empty">
        <EmptyState title={emptyTitle ?? emptyMessage} description={emptyTitle ? emptyMessage : undefined} action={emptyAction} />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div data-testid="async-error">
        <ErrorState message={state.message} retry={state.retry} />
      </div>
    );
  }

  return <>{children(state.data)}</>;
}
