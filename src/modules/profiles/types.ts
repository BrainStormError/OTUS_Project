import type { RatingEntry } from '@/modules/ratings';

export type ProfileStats = {
  count: number;
  genres: { genre: string; count: number }[];
  years: { year: number; count: number }[];
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
  stats: ProfileStats;
  recent: RatingEntry[];
};
