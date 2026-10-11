import { redirect } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { GroupInvitations } from '@/components/features/movie-tracker/GroupInvitations';
import { GroupsView } from '@/components/features/movie-tracker/GroupsView';
import { getActor } from '@/modules/auth/session';
import { getDiscoverableGroups, getGroups, listMyInvitations } from '@/modules/groups';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const [groups, discover, invitations] = await Promise.all([
    getGroups(actor),
    getDiscoverableGroups(actor),
    listMyInvitations(actor),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Группы</h1>
      <GroupInvitations
        invitations={
          invitations.ok
            ? invitations.value.map((invitation) => ({
                id: invitation.id,
                groupId: invitation.groupId,
                groupName: invitation.groupName,
                inviterName: invitation.inviterName,
                inviterHandle: invitation.inviterHandle,
              }))
            : []
        }
      />
      <GroupsView
        groups={groups.ok ? groups.value.map(toGroup) : []}
        discoverGroups={discover.ok ? discover.value.map(toGroup) : undefined}
        currentUserId={actor.id}
      />
    </div>
  );
}
