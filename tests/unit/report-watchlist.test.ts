import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  deleteRemoteWatchlist,
  saveRemoteWatchlist,
} from '@/components/features/movie-tracker/report-watchlist';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveRemoteWatchlist', () => {
  it('posts the media kind and ref and returns the id', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 12 }) }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const id = await saveRemoteWatchlist({ mediaKind: 'film', mediaRef: '27205' });

    expect(id).toBe(12);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/watchlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ mediaKind: 'film', mediaRef: '27205' }),
      }),
    );
  });

  it('returns null when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) })));
    expect(await saveRemoteWatchlist({ mediaKind: 'film', mediaRef: '27205' })).toBeNull();
  });
});

describe('deleteRemoteWatchlist', () => {
  it('sends a delete with the id', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await deleteRemoteWatchlist(7)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/watchlist?id=7', { method: 'DELETE' });
  });

  it('returns false when the delete fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false })));
    expect(await deleteRemoteWatchlist(7)).toBe(false);
  });
});
