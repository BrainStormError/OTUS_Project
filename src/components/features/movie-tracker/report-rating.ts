import type { RatingPayload } from './RatingForm';
import type { Movie } from './types';

export function reportRating(movie: Movie, payload: RatingPayload): void {
  if (typeof fetch !== 'function') {
    return;
  }
  const watchedAt = payload.watchedAt || new Date().toISOString().slice(0, 10);
  try {
    void fetch('/api/records', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mediaKind: 'film',
        mediaRef: String(movie.tmdbId),
        title: movie.title,
        year: movie.year,
        genres: movie.genres,
        rating: payload.rating,
        comment: payload.comment,
        watchedAt,
      }),
    }).catch(() => undefined);
  } catch {
    // Local optimistic state already reflects the record.
  }
}
