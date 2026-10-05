import { redirect } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { GroupsView } from '@/components/features/movie-tracker/GroupsView';
import { getActor } from '@/modules/auth/session';
import { getDiscoverableGroups, getGroups } from '@/modules/groups';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const [groups, discover] = await Promise.all([
    getGroups(actor),
    getDiscoverableGroups(actor),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Группы</h1>
      <GroupsView
        groups={groups.ok ? groups.value.map(toGroup) : []}
        discoverGroups={discover.ok ? discover.value.map(toGroup) : undefined}
        currentUserId={actor.id}
      />
    </div>
  );
}
