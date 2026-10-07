export type Movie = {
  tmdbId: number;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  actors?: string[];
  director?: string;
  posterUrl?: string | null;
};

export type WatchedRecord = {
  id: number;
  movie: Movie;
  rating: number;
  comment?: string;
  watchedAt: string;
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
  avatarUrl?: string | null;
  isFriend?: boolean;
  profileHidden?: boolean;
  statsHidden?: boolean;
  stats: UserStats;
  recent: WatchedRecord[];
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
  actor?: string[];
  director?: string[];
  year?: string[];
};

export type FilterKey = keyof SearchFilters;

export type EpisodeMeta = {
  number: number;
  title?: string;
};

export type SeasonMeta = {
  number: number;
  episodes: EpisodeMeta[];
};

export type Series = {
  id: string;
  title: string;
  year: number;
  genres: string[];
  seasons: SeasonMeta[];
  posterUrl?: string | null;
};

export type SeriesMode = 'per-episode' | 'whole';

export type EpisodeRating = {
  rating: number;
  comment?: string;
};

export type SeriesRecord = {
  id: string;
  series: Series;
  mode: SeriesMode;
  seriesRating?: number;
  seriesComment?: string;
  episodes?: Record<string, EpisodeRating>;
  watchedAt: string;
};
