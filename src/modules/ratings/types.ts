export type MediaKind = 'film' | 'series';

export type RatingEntry = {
  id: number;
  userId: number;
  mediaId: number;
  mediaKind: MediaKind;
  mediaRef: string;
  title: string;
  year: number | null;
  genres: string[];
  rating: number;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
};

export type GroupRatingMember = {
  mediaId: number;
  userId: number;
  name: string;
  handle: string;
  rating: number;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
};

export type GroupRatingSummary = {
  mediaId: number;
  mediaKind: MediaKind;
  mediaRef: string;
  title: string;
  year: number | null;
  average: number;
  discussionId: number | null;
  ratings: GroupRatingMember[];
};
