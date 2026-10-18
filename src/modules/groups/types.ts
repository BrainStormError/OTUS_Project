export type GroupMemberSummary = {
  id: number;
  name: string;
  handle: string;
  role: 'admin' | 'member';
};

export type GroupStats = {
  films: number;
  series: number;
  genres: { genre: string; count: number }[];
  years: { year: number; count: number }[];
};

export type GroupSummary = {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  restricted: boolean;
  members: GroupMemberSummary[];
  stats: GroupStats;
};

export type GroupInvitationStatus = 'pending' | 'accepted' | 'declined';

export type GroupInvitation = {
  id: number;
  groupId: number;
  groupName: string;
  inviterId: number;
  inviterName: string;
  inviterHandle: string;
  inviteeId: number;
  inviteeName: string;
  inviteeHandle: string;
  status: GroupInvitationStatus;
  createdAt: string;
};
