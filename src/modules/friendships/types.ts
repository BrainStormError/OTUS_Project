export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type SocialUser = {
  id: string;
  name: string;
  handle: string;
};

export type FriendRequestSummary = {
  id: string;
  user: SocialUser;
};
