import { describe, expect, it } from 'vitest';

import { addWatchlistInput } from '@/modules/watchlist';

describe('addWatchlistInput', () => {
  it('accepts a media kind and a reference', () => {
    expect(addWatchlistInput.safeParse({ mediaKind: 'film', mediaRef: '27205' }).success).toBe(
      true,
    );
    expect(addWatchlistInput.safeParse({ mediaKind: 'series', mediaRef: '1396' }).success).toBe(
      true,
    );
  });

  it('rejects an unknown media kind', () => {
    expect(addWatchlistInput.safeParse({ mediaKind: 'book', mediaRef: '1' }).success).toBe(false);
  });

  it('rejects an empty reference', () => {
    expect(addWatchlistInput.safeParse({ mediaKind: 'film', mediaRef: '  ' }).success).toBe(false);
  });

  it('rejects extra keys', () => {
    expect(
      addWatchlistInput.safeParse({ mediaKind: 'film', mediaRef: '1', rating: 5 }).success,
    ).toBe(false);
  });
});
