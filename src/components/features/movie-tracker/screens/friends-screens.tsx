'use client';

import { ErrorState } from '@/components/ui/error-state';
import type { FriendEntry, FriendRequestSummary } from '@/modules/friendships';

import { toFriendContact, toFriendRequest } from '../adapters';
import { FriendRequestsView } from '../FriendRequestsView';
import { FriendsView } from '../FriendsView';
import { useRead } from '../read-store';

type FriendsRead = {
  friends: FriendEntry[];
  incoming: FriendRequestSummary[];
  outgoing: FriendRequestSummary[];
};

const FRIENDS_URL = '/api/friendships';

export function FriendsScreen() {
  const state = useRead<FriendsRead>(FRIENDS_URL);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить друзей." retry={state.retry} />
    );
  }

  return (
    <FriendsView
      initialRequests={state.data.incoming.map(toFriendRequest)}
      initialOutgoing={state.data.outgoing.map(toFriendRequest)}
      initialFriends={state.data.friends.map(toFriendContact)}
    />
  );
}

export function FriendRequestsScreen() {
  const state = useRead<FriendsRead>(FRIENDS_URL);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить заявки." retry={state.retry} />
    );
  }

  return (
    <FriendRequestsView
      incoming={state.data.incoming.map(toFriendRequest)}
      outgoing={state.data.outgoing.map(toFriendRequest)}
    />
  );
}
