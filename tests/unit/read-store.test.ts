import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordsStore, watchlistStore } from '@/components/features/movie-tracker/list-store';
import {
  invalidateReads,
} from '@/components/features/movie-tracker/read-invalidation';
import {
  getReadState,
  loadRead,
  resetReadStore,
  retryRead,
  useRead,
} from '@/components/features/movie-tracker/read-store';
import { loadSession, SESSION_READS } from '@/components/layout/session-loader';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('read store', () => {
  it('loads a read once per session and reuses the loaded state', async () => {
    const fetchMock = vi.fn(async () => json({ items: [1] }));
    vi.stubGlobal('fetch', fetchMock);

    await loadRead('/api/records');
    await loadRead('/api/records');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getReadState('/api/records')).toEqual({ status: 'ready', data: { items: [1] } });
  });

  it('records the failure code of a refused read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'нет' }, 404)));

    await loadRead('/api/me/profile');

    expect(getReadState('/api/me/profile')).toEqual({ status: 'error', code: 404 });
  });

  it('keeps a failed read failed until a retry succeeds', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempts += 1;
        return attempts === 1 ? json({}, 500) : json({ ok: true });
      }),
    );

    await loadRead('/api/friendships');
    expect(getReadState('/api/friendships').status).toBe('error');

    await retryRead('/api/friendships');
    expect(getReadState('/api/friendships')).toEqual({ status: 'ready', data: { ok: true } });
    expect(attempts).toBe(2);
  });

  it('surfaces the failure and the retry to a reading component', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempts += 1;
        return attempts === 1 ? json({}, 500) : json({ items: [] });
      }),
    );

    const { result } = renderHook(() => useRead<{ items: unknown[] }>('/api/records'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});

describe('session loader', () => {
  it('loads every session read once per session', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      void input;
      return json({ items: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    await loadSession();
    await loadSession();

    for (const url of SESSION_READS) {
      const calls = fetchMock.mock.calls.filter(([input]) => String(input) === url);
      expect(calls).toHaveLength(1);
    }
    expect(fetchMock).toHaveBeenCalledTimes(SESSION_READS.length);
  });

  it('shows the loaded state to a component without fetching again', async () => {
    const fetchMock = vi.fn(async () => json({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await loadSession();

    const { result } = renderHook(() => useRead('/api/friendships'));
    expect(result.current).toEqual({ status: 'ready', data: { items: [] }, retry: expect.any(Function) });
    expect(fetchMock).toHaveBeenCalledTimes(SESSION_READS.length);
  });
});

const ratingEntry = {
  id: 7,
  userId: 1,
  mediaId: 10,
  mediaKind: 'film' as const,
  mediaRef: '27205',
  title: 'Начало',
  year: 2010,
  genres: ['Фантастика'],
  rating: 9,
  comment: null,
  watchedAt: '2024-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const watchlistEntry = {
  id: 3,
  userId: 1,
  mediaId: 20,
  mediaKind: 'series' as const,
  mediaRef: '1396',
  title: 'Во все тяжкие',
  year: 2008,
  genres: ['Драма'],
  createdAt: '2024-02-01T00:00:00.000Z',
};

describe('session hydration feeds the list stores', () => {
  it('places hydrated records and watch-later items in the store snapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/me/identity') return json({ id: 7, name: 'Алексей', handle: 'me' });
        if (url === '/api/records') return json({ items: [ratingEntry] });
        if (url === '/api/watchlist?kind=series') return json({ items: [watchlistEntry] });
        return json({ items: [] });
      }),
    );

    await loadSession();

    const records = recordsStore.handle(7).getSnapshot();
    expect(records.map((record) => record.movie.title)).toEqual(['Начало']);

    const watchlist = watchlistStore.handle(7).getSnapshot();
    expect(watchlist.map((item) => item.movie.title)).toEqual(['Во все тяжкие']);
  });
});

describe('invalidation feeds the loaded state', () => {
  it('replaces the stored read with the reloaded response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.cache === 'reload') {
          return json({ items: [ratingEntry] });
        }
        return json({ items: [] });
      }),
    );

    await loadRead('/api/records');
    expect(getReadState('/api/records')).toEqual({ status: 'ready', data: { items: [] } });

    await invalidateReads(['/api/records']);

    expect(getReadState('/api/records')).toEqual({ status: 'ready', data: { items: [ratingEntry] } });
  });
});

describe('store reset', () => {
  it('drops the loaded state so the next session starts cold', async () => {
    const fetchMock = vi.fn(async () => json({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await loadRead('/api/records');
    resetReadStore();
    await loadRead('/api/records');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
