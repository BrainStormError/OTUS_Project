import type { RelationshipStatus } from '@/modules/friendships';

export type MediaKind = 'film' | 'series';

export type Movie = {
  tmdbId: number;
  kind: MediaKind;
  title: string;
  year: number | null;
  rating: number;
  genres: string[];
  director?: string | null;
  overview?: string | null;
  posterUrl?: string | null;
};

export type WatchedRecord = {
  id: number;
  movie: Movie;
  rating: number;
  comment?: string;
  watchedAt: string;
};

export type WatchlistItem = {
  id: number;
  movie: Movie;
  addedAt: string;
};

export type GenreCount = { genre: string; count: number };
export type YearCount = { year: number; count: number };

export type UserStats = {
  count: number;
  genres: GenreCount[];
  years: YearCount[];
};

export type PublicUser = {
  id: number;
  handle: string;
  name: string;
  isFriend?: boolean;
  profileHidden?: boolean;
  statsHidden?: boolean;
  relationship?: RelationshipStatus | null;
  friendshipId?: number | null;
  stats: UserStats;
  recent: WatchedRecord[];
};

export type FriendContact = {
  friendshipId: number;
  user: PublicUser;
};

export type FriendRequest = {
  id: number;
  user: PublicUser;
};

export type GroupMember = {
  id: number;
  name: string;
  handle: string;
  role: 'admin' | 'member';
};

export type Group = {
  id: number;
  name: string;
  description?: string;
  tags: string[];
  members: GroupMember[];
  stats: UserStats;
  restricted?: boolean;
};

export type SearchFilters = {
  title?: string;
  genre?: string[];
  yearFrom?: string;
  yearTo?: string;
};

export type FilterKey = keyof SearchFilters;

export type FilterOption = {
  value: string;
  label: string;
};
