import { redirect } from 'next/navigation';

import { toFriendRequest } from '@/components/features/movie-tracker/adapters';
import { FriendRequestsView } from '@/components/features/movie-tracker/FriendRequestsView';
import { getActor } from '@/modules/auth/session';
import { getIncomingRequests, getOutgoingRequests } from '@/modules/friendships';

export const dynamic = 'force-dynamic';

export default async function FriendRequestsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const [incoming, outgoing] = await Promise.all([
    getIncomingRequests(actor),
    getOutgoingRequests(actor),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Заявки в друзья</h1>
      <FriendRequestsView
        incoming={incoming.ok ? incoming.value.map(toFriendRequest) : []}
        outgoing={outgoing.ok ? outgoing.value.map(toFriendRequest) : []}
      />
    </div>
  );
}
