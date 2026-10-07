// Public surface for user lookups that must not pull the NextAuth runtime
// into non-HTTP consumers (for example integration tests or other modules).
export {
  deriveHandle,
  findOrCreateDemoUser,
  findUserByEmail,
  findUserByHandle,
  findUserById,
  insertUser,
  updatePrivacy,
} from './repository';
export type { UserRow } from './types';
