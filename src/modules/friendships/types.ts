export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type SocialUser = {
  id: number;
  name: string;
  handle: string;
};

export type FriendRequestSummary = {
  id: number;
  user: SocialUser;
};

export type RelationshipStatus = 'friend' | 'pending_in' | 'pending_out' | 'none';

export type Relationship = {
  status: RelationshipStatus;
  friendshipId: number | null;
};

export type FriendEntry = {
  friendshipId: number;
  user: SocialUser;
};

export type UserSearchResult = {
  id: number;
  name: string;
  handle: string;
  relationship: RelationshipStatus;
  friendshipId: number | null;
};
