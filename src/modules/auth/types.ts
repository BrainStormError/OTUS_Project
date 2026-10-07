export type { Actor, Role } from '@/core/auth/policy';

export type UserRow = {
  id: number;
  email: string;
  name: string | null;
  handle: string | null;
  role: 'employee' | 'admin';
  provider: string | null;
  providerSubject: string | null;
  profileHidden: boolean;
  statsHidden: boolean;
  createdAt: string;
};
