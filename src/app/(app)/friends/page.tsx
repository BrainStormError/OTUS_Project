import { redirect } from 'next/navigation';

import { toFriendRequest, toPublicUser } from '@/components/features/movie-tracker/adapters';
import { FriendsView } from '@/components/features/movie-tracker/FriendsView';
import { getActor } from '@/modules/auth/session';
import { getFriends, getIncomingRequests, getOutgoingRequests } from '@/modules/friendships';

export const dynamic = 'force-dynamic';

export default async function FriendsPage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const [friends, requests, outgoing] = await Promise.all([
    getFriends(actor),
    getIncomingRequests(actor),
    getOutgoingRequests(actor),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Друзья</h1>
      <FriendsView
        initialRequests={requests.ok ? requests.value.map(toFriendRequest) : []}
        initialOutgoing={outgoing.ok ? outgoing.value.map(toFriendRequest) : []}
        initialFriends={friends.ok ? friends.value.map(toPublicUser) : []}
      />
    </div>
  );
}
