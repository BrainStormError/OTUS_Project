'use client';

import Link from 'next/link';
import { Suspense } from 'react';

import { GroupAdminScreen } from '@/components/features/movie-tracker/screens/groups-screens';
import { usePathSegment } from '@/components/features/movie-tracker/screens/use-path-segment';

export default function GroupAdminShellPage() {
  const raw = usePathSegment(2);
  const groupId = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={groupId !== null ? `/groups/${groupId}` : '/groups'}
        prefetch={false}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← К группе
      </Link>
      {groupId !== null ? (
        <Suspense fallback={null}>
          <GroupAdminScreen groupId={groupId} />
        </Suspense>
      ) : null}
    </div>
  );
}
