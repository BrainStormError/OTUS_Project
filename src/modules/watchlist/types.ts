import type { MediaKind } from '@/modules/ratings';

export type { MediaKind };

export type WatchlistEntry = {
  id: number;
  userId: number;
  mediaId: number;
  mediaKind: MediaKind;
  mediaRef: string;
  title: string;
  year: number | null;
  genres: string[];
  createdAt: string;
};
