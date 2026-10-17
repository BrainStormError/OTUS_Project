'use client';

import Link from 'next/link';
import { Suspense } from 'react';

import { GroupScreen } from '@/components/features/movie-tracker/screens/groups-screens';
import { usePathSegment } from '@/components/features/movie-tracker/screens/use-path-segment';

export default function GroupShellPage() {
  const raw = usePathSegment(1);
  const groupId = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/groups"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Группы
      </Link>
      {groupId !== null ? (
        <Suspense fallback={null}>
          <GroupScreen groupId={groupId} />
        </Suspense>
      ) : null}
    </div>
  );
}
