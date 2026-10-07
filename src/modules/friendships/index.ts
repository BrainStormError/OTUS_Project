export {
  acceptFriendship,
  createFriendRequest,
  declineFriendship,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  searchUsers,
  withdrawFriendRequest,
} from './service';
export {
  createFriendRequestInput,
  friendshipDecisionInput,
  userSearchInput,
} from './schema';
export type {
  CreateFriendRequestInput,
  FriendshipDecisionInput,
  UserSearchInput,
} from './schema';
export type {
  FriendshipStatus,
  Friendship,
  RelationshipStatus,
  SocialUser,
  FriendRequestSummary,
  UserSearchResult,
} from './types';
