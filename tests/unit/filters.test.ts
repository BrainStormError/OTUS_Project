import { describe, expect, it } from 'vitest';

import { inYearRange, movieMatches, recordMatches, watchedAtYear } from '@/components/features/movie-tracker/filters';
import type { Movie, WatchedRecord } from '@/components/features/movie-tracker/types';

function movie(over: Partial<Movie> = {}): Movie {
  return {
    tmdbId: 1,
    kind: 'film',
    title: 'Начало',
    year: 2010,
    rating: 8,
    genres: ['Драма'],
    posterUrl: null,
    ...over,
  };
}

function record(over: Partial<WatchedRecord> = {}): WatchedRecord {
  return {
    id: 1,
    movie: movie(),
    rating: 8,
    watchedAt: '2020-05-01',
    ...over,
  };
}

describe('movieMatches year range', () => {
  it('matches a title inside the range', () => {
    expect(movieMatches(movie({ year: 2005 }), { yearFrom: '2000', yearTo: '2010' })).toBe(true);
  });

  it('excludes a title outside the range', () => {
    expect(movieMatches(movie({ year: 1999 }), { yearFrom: '2000', yearTo: '2010' })).toBe(false);
    expect(movieMatches(movie({ year: 2011 }), { yearFrom: '2000', yearTo: '2010' })).toBe(false);
  });

  it('leaves an unset bound unbounded', () => {
    expect(movieMatches(movie({ year: 2050 }), { yearFrom: '2000' })).toBe(true);
    expect(movieMatches(movie({ year: 1900 }), { yearTo: '2000' })).toBe(true);
  });

  it('matches everything when the range is unset', () => {
    expect(inYearRange(2010)).toBe(true);
    expect(inYearRange(2010, '', '')).toBe(true);
    expect(movieMatches(movie({ year: null }), {})).toBe(true);
  });

  it('excludes a title with no year when a bound is set', () => {
    expect(movieMatches(movie({ year: null }), { yearFrom: '2000' })).toBe(false);
    expect(inYearRange(null, undefined, '2000')).toBe(false);
  });
});

describe('recordMatches watch year', () => {
  it('extracts the year from a watchedAt value', () => {
    expect(watchedAtYear('2024-03-01')).toBe(2024);
    expect(watchedAtYear(undefined)).toBeNull();
    expect(watchedAtYear('')).toBeNull();
  });

  it('matches a record by its watch year', () => {
    const watched = record({ movie: movie({ year: 1990 }), watchedAt: '2024-03-01' });
    expect(recordMatches(watched, { yearFrom: '2024', yearTo: '2024' })).toBe(true);
  });

  it('misses when the watch year differs from the release year', () => {
    const watched = record({ movie: movie({ year: 2024 }), watchedAt: '2019-03-01' });
    expect(recordMatches(watched, { yearFrom: '2024', yearTo: '2024' })).toBe(false);
  });
});
