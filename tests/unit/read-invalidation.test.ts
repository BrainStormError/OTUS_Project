import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  invalidateReads,
  READS_BY_SIGNAL,
  readsForSignal,
} from '@/components/features/movie-tracker/read-invalidation';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('invalidateReads', () => {
  it('re-fetches every read with cache reload so the cached entry is replaced', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await invalidateReads(['/api/records', '/api/friendships']);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/records', {
      cache: 'reload',
      headers: { accept: 'application/json' },
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/friendships', {
      cache: 'reload',
      headers: { accept: 'application/json' },
    });
  });

  it('resolves without throwing when the network is down', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('network down');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(invalidateReads(['/api/records'])).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps reloading the remaining reads when one fails', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/records') {
        throw new TypeError('network down');
      }
      return new Response('{}', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await invalidateReads(['/api/records', '/api/friendships']);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('readsForSignal', () => {
  it('maps every signal kind to the reads it affects', () => {
    expect(readsForSignal('film_rated')).toContain('/api/records');
    expect(readsForSignal('film_rated')).toContain('/api/me/profile');
    expect(readsForSignal('series_rated')).toContain('/api/watchlist?kind=film');

    expect(readsForSignal('friendship_accepted')).toEqual(
      expect.arrayContaining(['/api/friendships', '/api/groups']),
    );
    expect(readsForSignal('friend_removed')).toEqual(
      expect.arrayContaining(['/api/friendships', '/api/groups']),
    );

    for (const kind of ['group_joined', 'group_left', 'group_removed', 'group_dissolved'] as const) {
      expect(readsForSignal(kind)).toEqual(
        expect.arrayContaining([
          '/api/groups',
          '/api/records',
          '/api/watchlist?kind=film',
          '/api/watchlist?kind=series',
        ]),
      );
    }
  });

  it('maps only known kinds and covers the whole signal domain', () => {
    expect(Object.keys(READS_BY_SIGNAL).sort()).toEqual(
      [
        'film_rated',
        'friend_removed',
        'friendship_accepted',
        'group_dissolved',
        'group_joined',
        'group_left',
        'group_removed',
        'series_rated',
      ].sort(),
    );
  });
});
