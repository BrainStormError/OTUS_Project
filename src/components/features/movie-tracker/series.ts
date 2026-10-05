import type { Movie, Series, SeriesRecord } from './types';

export function episodeKey(season: number, episode: number): string {
  return `${season}:${episode}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function seasonAverage(record: SeriesRecord, season: number): number | null {
  if (record.mode !== 'per-episode' || !record.episodes) {
    return null;
  }
  const meta = record.series.seasons.find((item) => item.number === season);
  if (!meta) {
    return null;
  }
  const ratings = meta.episodes
    .map((episode) => record.episodes?.[episodeKey(season, episode.number)]?.rating)
    .filter((rating): rating is number => typeof rating === 'number');
  if (ratings.length === 0) {
    return null;
  }
  return round1(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);
}

export function seriesAverage(record: SeriesRecord): number | null {
  if (record.mode === 'whole') {
    return typeof record.seriesRating === 'number' ? record.seriesRating : null;
  }
  const seasons = record.series.seasons;
  const first = seasons[0];
  if (seasons.length === 1 && first) {
    return seasonAverage(record, first.number);
  }
  const averages = seasons
    .map((season) => seasonAverage(record, season.number))
    .filter((value): value is number => value !== null);
  if (averages.length === 0) {
    return null;
  }
  return round1(averages.reduce((sum, value) => sum + value, 0) / averages.length);
}

function hashId(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function seriesToMovie(series: Series): Movie {
  return {
    tmdbId: hashId(series.id),
    title: series.title,
    year: series.year,
    rating: 0,
    genres: series.genres,
    actors: [],
    director: undefined,
    posterUrl: series.posterUrl ?? null,
  };
}
