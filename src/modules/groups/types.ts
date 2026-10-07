export type GroupMemberSummary = {
  id: number;
  name: string;
  handle: string;
  role: 'admin' | 'member';
};

export type GroupSummary = {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  restricted: boolean;
  members: GroupMemberSummary[];
};
