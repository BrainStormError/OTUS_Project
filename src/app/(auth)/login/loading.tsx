import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center py-16">
      <div
        role="status"
        aria-busy="true"
        aria-label="Загрузка"
        data-testid="login-loading-skeleton"
        className="w-full max-w-sm space-y-6"
      >
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-7 w-24" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </main>
  );
}
