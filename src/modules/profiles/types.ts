import type { Relationship } from '@/modules/friendships';
import type { RatingEntry } from '@/modules/ratings';

export type GenreCount = { genre: string; count: number };
export type YearCount = { year: number; count: number };

export type ProfileStats = {
  films: number;
  series: number;
  genres: GenreCount[];
  years: YearCount[];
};

export type ProfileIdentity = {
  id: number;
  name: string;
  handle: string;
  profileHidden: boolean;
  statsHidden: boolean;
};

export type ProfileRead = {
  identity: ProfileIdentity;
  isOwn: boolean;
  profileRestricted: boolean;
  statsRestricted: boolean;
  relationship: Relationship | null;
  stats: ProfileStats;
  recent: RatingEntry[];
};
