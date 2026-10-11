import { describe, expect, it } from 'vitest';

import { detailCacheKey, searchCacheKey } from '@/modules/catalog/cache-key';

describe('catalog cache key', () => {
  it('is stable regardless of genre id order', () => {
    expect(searchCacheKey('film', { genreIds: [878, 28] })).toBe(
      searchCacheKey('film', { genreIds: [28, 878] }),
    );
  });

  it('collapses surrounding and repeated whitespace in the query', () => {
    expect(searchCacheKey('film', { query: '  matrix   reloaded ' })).toBe(
      searchCacheKey('film', { query: 'matrix reloaded' }),
    );
  });

  it('treats case-sensitive queries as distinct', () => {
    expect(searchCacheKey('film', { query: 'Matrix' })).not.toBe(
      searchCacheKey('film', { query: 'matrix' }),
    );
  });

  it('keeps kind, year bounds and page apart', () => {
    const base = searchCacheKey('film', { query: 'matrix' });
    expect(searchCacheKey('series', { query: 'matrix' })).not.toBe(base);
    expect(searchCacheKey('film', { query: 'matrix', yearFrom: 1999 })).not.toBe(base);
    expect(searchCacheKey('film', { query: 'matrix', yearTo: 2003 })).not.toBe(base);
    expect(searchCacheKey('film', { query: 'matrix', page: 2 })).not.toBe(base);
  });

  it('defaults the page to the first page', () => {
    expect(searchCacheKey('film', {})).toBe(searchCacheKey('film', { page: 1 }));
  });

  it('pins the language in search and detail keys', () => {
    expect(searchCacheKey('film', {})).toBe('search:film|p=1|lang=ru-RU');
    expect(detailCacheKey('film', '27205')).toBe('detail:film:27205|lang=ru-RU');
    expect(detailCacheKey('series', '1396')).toBe('detail:series:1396|lang=ru-RU');
  });
});
