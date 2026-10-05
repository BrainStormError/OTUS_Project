export type GroupMemberSummary = {
  id: string;
  name: string;
  handle: string;
  role: 'admin' | 'member';
};

export type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  restricted: boolean;
  members: GroupMemberSummary[];
};
