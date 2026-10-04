import type { Actor } from '@/core/auth/policy';

import { findUserById } from './repository';

export async function resolveActor(
  userId: string | null | undefined,
): Promise<Actor | null> {
  if (!userId) {
    return null;
  }
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }
  return { id: user.id, role: user.role, email: user.email };
}
