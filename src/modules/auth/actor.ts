import type { Actor } from '@/core/auth/policy';

import { findUserById } from './repository';

// Short-lived, process-wide cache of the database-derived actor. The role and
// the user's existence are still decided by the database read that fills this
// cache; a token alone never grants access. The entry expires quickly so a
// removed user loses access within the bound, and identity mutations invalidate
// the entry so profile changes are visible immediately.
export const ACTOR_CACHE_TTL_MS = 60_000;

type ActorEntry = { actor: Actor | null; expiresAt: number };

const actorCache = new Map<number, ActorEntry>();

export function invalidateActor(userId: number): void {
  actorCache.delete(userId);
}

export async function resolveActor(
  userId: number | null | undefined,
): Promise<Actor | null> {
  if (!userId) {
    return null;
  }

  const now = Date.now();
  const cached = actorCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.actor;
  }

  const user = await findUserById(userId);
  const actor: Actor | null = user
    ? {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        handle: user.handle,
      }
    : null;
  actorCache.set(userId, { actor, expiresAt: now + ACTOR_CACHE_TTL_MS });
  return actor;
}
