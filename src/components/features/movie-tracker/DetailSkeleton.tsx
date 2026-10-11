import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

export function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Загрузка"
      data-testid="detail-skeleton"
      className="flex flex-col gap-6 sm:flex-row"
    >
      <Skeleton className="aspect-[2/3] w-full max-w-[220px] shrink-0 rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}
