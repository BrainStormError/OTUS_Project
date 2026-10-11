import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { DissolveGroupButton } from '@/components/features/movie-tracker/DissolveGroupButton';
import { GroupSettingsForm } from '@/components/features/movie-tracker/GroupSettingsForm';
import { getActor } from '@/modules/auth/session';
import { canViewGroup, getGroup, getGroupRole, listGroupInvitations } from '@/modules/groups';

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
  const invitations = role === 'admin' ? await listGroupInvitations(actor, groupId) : null;

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
      {role === 'admin' ? <GroupSettingsForm group={group} /> : null}
      {role === 'admin' ? <DissolveGroupButton groupId={group.id} /> : null}
      <AdminMemberPanel
        group={group}
        isAdmin={role === 'admin'}
        currentUserId={actor.id}
        invitations={invitations?.ok ? invitations.value : []}
      />
    </div>
  );
}
