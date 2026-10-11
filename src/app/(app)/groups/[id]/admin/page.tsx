import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { getActor } from '@/modules/auth/session';
import { canViewGroup, getGroup, getGroupRole } from '@/modules/groups';

export const dynamic = 'force-dynamic';

export default async function GroupAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  if (!(await canViewGroup(actor, groupId))) {
    notFound();
  }

  const result = await getGroup(actor, groupId);
  if (!result.ok) {
    notFound();
  }

  const role = await getGroupRole(groupId, actor.id);
  const group = toGroup(result.value);

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
      <AdminMemberPanel group={group} isAdmin={role === 'admin'} />
    </div>
  );
}
