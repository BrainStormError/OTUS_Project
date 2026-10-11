import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

import type { GroupTabId } from './GroupTabs';

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <ul
      data-testid="skeleton-list"
      className="divide-y divide-border rounded-lg border border-border"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <li
          key={index}
          className="flex min-h-14 items-center justify-between gap-3 px-4 py-2"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

function StatsSkeleton() {
  return (
    <div data-testid="skeleton-stats" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <Skeleton className="h-4 w-1/3" />
            <SkeletonText lines={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GroupTabSkeleton({ tab }: { tab: GroupTabId }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Загрузка"
      data-testid="group-tab-skeleton"
      data-tab={tab}
      className="space-y-4"
    >
      {tab === 'stats' ? <StatsSkeleton /> : <ListSkeleton rows={tab === 'members' ? 5 : 4} />}
    </div>
  );
}
