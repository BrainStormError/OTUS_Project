import { describe, expect, it } from 'vitest';

import { seasonAverage, seriesAverage } from '@/components/features/movie-tracker/series';
import { findSeries } from '@/components/features/movie-tracker/series-data';
import type { SeriesRecord } from '@/components/features/movie-tracker/types';

const breakingBad = findSeries('breaking-bad')!;
const chernobyl = findSeries('chernobyl')!;

describe('series averages', () => {
  it('averages only rated episodes, per season and across seasons', () => {
    const record: SeriesRecord = {
      id: 'r1',
      series: breakingBad,
      mode: 'per-episode',
      episodes: {
        '1:1': { rating: 9 },
        '1:3': { rating: 7 },
        '2:1': { rating: 10 },
      },
      watchedAt: '2026-01-01',
    };
    expect(seasonAverage(record, 1)).toBe(8);
    expect(seasonAverage(record, 2)).toBe(10);
    expect(seriesAverage(record)).toBe(9);
  });

  it('uses the single season average directly for a single-season series', () => {
    const record: SeriesRecord = {
      id: 'r2',
      series: chernobyl,
      mode: 'per-episode',
      episodes: { '1:1': { rating: 8 }, '1:2': { rating: 9 } },
      watchedAt: '2026-01-02',
    };
    expect(seasonAverage(record, 1)).toBe(8.5);
    expect(seriesAverage(record)).toBe(seasonAverage(record, 1));
  });

  it('returns the whole-series rating in whole mode and no season ratings', () => {
    const record: SeriesRecord = {
      id: 'r3',
      series: chernobyl,
      mode: 'whole',
      seriesRating: 9.4,
      watchedAt: '2026-01-03',
    };
    expect(seriesAverage(record)).toBe(9.4);
    expect(seasonAverage(record, 1)).toBeNull();
  });

  it('returns null when no episode is rated', () => {
    const record: SeriesRecord = {
      id: 'r4',
      series: breakingBad,
      mode: 'per-episode',
      episodes: {},
      watchedAt: '2026-01-04',
    };
    expect(seasonAverage(record, 1)).toBeNull();
    expect(seriesAverage(record)).toBeNull();
  });
});
