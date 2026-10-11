import type { RatedTitle } from '@/modules/catalog';
import type { FriendEntry, FriendRequestSummary, SocialUser } from '@/modules/friendships';
import type { GroupSummary } from '@/modules/groups';
import type { ProfileRead } from '@/modules/profiles';
import type { RatingEntry } from '@/modules/ratings';
import type { WatchlistEntry } from '@/modules/watchlist';

import type {
  FriendContact,
  FriendRequest,
  Group,
  Movie,
  PublicUser,
  UserStats,
  WatchedRecord,
  WatchlistItem,
} from './types';

const EMPTY_STATS: UserStats = { count: 0, genres: [], years: [] };

export function toPublicUser(user: SocialUser): PublicUser {
  return {
    id: user.id,
    handle: user.handle,
    name: user.name,
    stats: EMPTY_STATS,
    recent: [],
  };
}

export function toFriendRequest(request: FriendRequestSummary): FriendRequest {
  return { id: request.id, user: toPublicUser(request.user) };
}

export function toFriendContact(entry: FriendEntry): FriendContact {
  return { friendshipId: entry.friendshipId, user: toPublicUser(entry.user) };
}

export function toGroup(group: GroupSummary): Group {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? undefined,
    tags: group.tags,
    members: group.members,
    stats: EMPTY_STATS,
    restricted: group.restricted,
  };
}

export function toMovieForEntry(entry: {
  mediaRef: string;
  mediaId: number;
  mediaKind: 'film' | 'series';
  title: string;
  year: number | null;
  genres: string[];
}): Movie {
  return {
    tmdbId: Number(entry.mediaRef) || entry.mediaId,
    kind: entry.mediaKind,
    title: entry.title,
    year: entry.year,
    rating: 0,
    genres: entry.genres,
    posterUrl: null,
  };
}

export function toWatchedRecord(entry: RatingEntry): WatchedRecord {
  return {
    id: entry.id,
    movie: toMovieForEntry(entry),
    rating: entry.rating,
    comment: entry.comment ?? undefined,
    watchedAt: entry.watchedAt,
  };
}

export function toWatchedRecordFromRated(entry: RatedTitle): WatchedRecord {
  return {
    id: entry.ratingId,
    movie: {
      tmdbId: Number(entry.externalRef) || entry.mediaId,
      kind: entry.kind,
      title: entry.title,
      year: entry.year,
      rating: 0,
      genres: entry.genres,
      director: entry.director,
      posterUrl: null,
    },
    rating: entry.rating,
    comment: entry.comment ?? undefined,
    watchedAt: entry.watchedAt,
  };
}

export function toWatchlistItem(entry: WatchlistEntry): WatchlistItem {
  return {
    id: entry.id,
    movie: toMovieForEntry(entry),
    addedAt: entry.createdAt.slice(0, 10),
  };
}

export function toPublicUserFromProfile(profile: ProfileRead): PublicUser {
  return {
    id: profile.identity.id,
    handle: profile.identity.handle,
    name: profile.identity.name,
    profileHidden: profile.identity.profileHidden,
    statsHidden: profile.identity.statsHidden,
    relationship: profile.relationship?.status ?? null,
    friendshipId: profile.relationship?.friendshipId ?? null,
    stats: profile.stats,
    recent: profile.recent.map(toWatchedRecord),
  };
}
