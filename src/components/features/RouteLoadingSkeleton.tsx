import { Skeleton, SkeletonGrid, SkeletonText } from '@/components/ui/skeleton';

export function RouteLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Загрузка"
      data-testid="route-loading-skeleton"
      className="space-y-6"
    >
      <Skeleton className="h-7 w-1/3" />
      <SkeletonText lines={2} />
      <SkeletonGrid count={6} />
    </div>
  );
}
