import { can, type Actor } from '@/core/auth/policy';

export function canCreateEntry(actor: Actor): boolean {
  return can(actor, 'directory:create');
}

export function canEditEntry(actor: Actor, entry: { ownerId: string }): boolean {
  return can(actor, 'directory:edit', { ownerId: entry.ownerId });
}
