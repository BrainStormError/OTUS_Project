export type MediaKind = 'film' | 'series';

export type WatchedRecordEntry = {
  id: string;
  userId: string;
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
