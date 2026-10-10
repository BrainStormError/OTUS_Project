import type { Group } from './types';

export function searchGroups(
  query: string,
  ownGroups: Group[],
  fallback: Group[] = [],
): Group[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = (group: Group) =>
    group.name.toLowerCase().includes(q) ||
    (group.description ?? '').toLowerCase().includes(q) ||
    group.tags.some((tag) => tag.toLowerCase().includes(q));
  const scoped = ownGroups.filter(matches);
  if (scoped.length > 0) return scoped;
  return fallback.filter((group) => !group.restricted && matches(group));
}
