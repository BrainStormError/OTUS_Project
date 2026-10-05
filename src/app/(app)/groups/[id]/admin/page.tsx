import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { findGroup, isGroupAdmin } from '@/components/features/movie-tracker/data';

export default async function GroupAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = findGroup(id);
  if (!group) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/groups/${group.id}`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← К группе
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        Управление группой «{group.name}»
      </h1>
      <AdminMemberPanel group={group} isAdmin={isGroupAdmin(group)} />
    </div>
  );
}
