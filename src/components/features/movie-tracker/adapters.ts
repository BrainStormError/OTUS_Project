import type { FriendRequestSummary, SocialUser } from '@/modules/friendships';
import type { GroupSummary } from '@/modules/groups';
import type { ProfileRead } from '@/modules/profiles';
import type { RatingEntry } from '@/modules/ratings';

import { findMovie } from './data';
import { findSeries } from './series-data';
import type {
  FriendRequest,
  Group,
  Movie,
  PublicUser,
  SeriesRecord,
  UserStats,
  WatchedRecord,
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

export function toWatchedRecord(entry: RatingEntry): WatchedRecord {
  const movie: Movie = findMovie(Number(entry.mediaRef)) ?? {
    tmdbId: Number(entry.mediaRef) || entry.mediaId,
    title: entry.title,
    year: entry.year ?? 0,
    rating: 0,
    genres: entry.genres,
    posterUrl: null,
  };
  return {
    id: entry.id,
    movie,
    rating: entry.rating,
    comment: entry.comment ?? undefined,
    watchedAt: entry.watchedAt,
  };
}

export function toSeriesRecord(entry: RatingEntry): SeriesRecord {
  const series =
    findSeries(entry.mediaRef) ??
    {
      id: entry.mediaRef,
      title: entry.title,
      year: entry.year ?? 0,
      genres: entry.genres,
      seasons: [],
      posterUrl: null,
    };
  return {
    id: String(entry.id),
    series,
    mode: 'whole',
    seriesRating: entry.rating,
    seriesComment: entry.comment ?? undefined,
    watchedAt: entry.watchedAt,
  };
}

export function toPublicUserFromProfile(profile: ProfileRead): PublicUser {
  return {
    id: profile.identity.id,
    handle: profile.identity.handle,
    name: profile.identity.name,
    profileHidden: profile.identity.profileHidden,
    statsHidden: profile.identity.statsHidden,
    stats: profile.stats,
    recent: profile.recent.map(toWatchedRecord),
  };
}
