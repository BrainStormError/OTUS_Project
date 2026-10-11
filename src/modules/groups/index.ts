export {
  getGroups,
  getDiscoverableGroups,
  getGroup,
  getGroupRole,
  canViewGroup,
  hasGroupRating,
  joinGroup,
  saveGroupRating,
  listGroupRatings,
} from './service';
export { joinGroupInput, groupRatingInput } from './schema';
export type { JoinGroupInput, GroupRatingInput } from './schema';
export type { GroupSummary, GroupMemberSummary } from './types';
export type { GroupRatingMember, GroupRatingSummary } from '@/modules/ratings';
