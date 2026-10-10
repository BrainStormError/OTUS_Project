import type { MediaKind } from '@/modules/ratings';

import type { Movie } from './types';

export type RemoteRatingInput = {
  mediaKind: MediaKind;
  mediaRef: string;
  rating: number;
  comment?: string;
  watchedAt: string;
};

export async function saveRemoteRating(input: RemoteRatingInput): Promise<number | null> {
  if (typeof fetch !== 'function') {
    return null;
  }
  const watchedAt = input.watchedAt || new Date().toISOString().slice(0, 10);
  const response = await fetch('/api/records', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...input, watchedAt }),
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json().catch(() => null)) as { id?: number } | null;
  return typeof data?.id === 'number' ? data.id : null;
}

export async function deleteRemoteRecord(id: number): Promise<boolean> {
  if (typeof fetch !== 'function') {
    return false;
  }
  const response = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
  return response.ok;
}

export function reportRating(
  movie: Movie,
  payload: { rating: number; comment?: string; watchedAt: string },
): void {
  void saveRemoteRating({
    mediaKind: movie.kind,
    mediaRef: String(movie.tmdbId),
    rating: payload.rating,
    comment: payload.comment,
    watchedAt: payload.watchedAt,
  }).catch(() => undefined);
}
