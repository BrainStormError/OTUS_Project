export type { Actor, Role } from '@/core/auth/policy';

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: 'employee' | 'admin';
  provider: string | null;
  providerSubject: string | null;
  createdAt: string;
};
