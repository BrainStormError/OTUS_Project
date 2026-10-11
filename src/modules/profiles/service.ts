import type { Actor } from '@/core/auth/policy';
import { err, ok, type Result } from '@/core/result';

import { findUserByHandle, findUserById, type UserRow } from '@/modules/auth/users';
import { getRelationship } from '@/modules/friendships';
import { listPersonalRatings, type RatingEntry } from '@/modules/ratings';

import type { ProfileRead, ProfileStats } from './types';

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function withinRecentWindow(entry: RatingEntry, now: number): boolean {
  return new Date(entry.createdAt).getTime() >= now - RECENT_WINDOW_MS;
}

export function computeProfileStats(entries: RatingEntry[]): ProfileStats {
  const genreMap = new Map<string, number>();
  const yearMap = new Map<number, number>();
  for (const entry of entries) {
    if (entry.year !== null) {
      yearMap.set(entry.year, (yearMap.get(entry.year) ?? 0) + 1);
    }
    for (const genre of entry.genres) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
    }
  }
  return {
    count: entries.length,
    genres: Array.from(genreMap, ([genre, count]) => ({ genre, count })).sort(
      (a, b) => b.count - a.count,
    ),
    years: Array.from(yearMap, ([year, count]) => ({ year, count })).sort(
      (a, b) => b.year - a.year,
    ),
  };
}

async function buildProfile(user: UserRow, viewerId: number | null): Promise<ProfileRead> {
  const isOwn = viewerId !== null && viewerId === user.id;
  const profileRestricted = user.profileHidden && !isOwn;
  const statsRestricted = (user.statsHidden || user.profileHidden) && !isOwn;

  const hidden = profileRestricted || statsRestricted;
  const entries = hidden ? [] : await listPersonalRatings(user.id);
  const now = Date.now();
  const relationship =
    viewerId !== null && !isOwn ? await getRelationship(viewerId, user.id) : null;

  return {
    identity: {
      id: user.id,
      name: user.name ?? 'Пользователь',
      handle: user.handle ?? String(user.id),
      profileHidden: user.profileHidden,
      statsHidden: user.statsHidden,
    },
    isOwn,
    profileRestricted,
    statsRestricted,
    relationship,
    stats: computeProfileStats(entries),
    recent: profileRestricted ? [] : entries.filter((entry) => withinRecentWindow(entry, now)),
  };
}

export async function getProfileByHandle(
  viewer: Actor | null,
  handle: string,
): Promise<Result<ProfileRead>> {
  const user = await findUserByHandle(handle);
  if (!user) {
    return err('NOT_FOUND', 'Пользователь не найден');
  }
  return ok(await buildProfile(user, viewer?.id ?? null));
}

export async function getOwnProfile(viewer: Actor): Promise<Result<ProfileRead>> {
  const user = await findUserById(viewer.id);
  if (!user) {
    return err('NOT_FOUND', 'Пользователь не найден');
  }
  return ok(await buildProfile(user, viewer.id));
}
