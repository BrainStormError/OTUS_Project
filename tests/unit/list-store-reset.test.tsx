import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ListStoreProvider,
  recordsStore,
  resetListStores,
  watchlistStore,
} from '@/components/features/movie-tracker/list-store';

const movie = {
  tmdbId: 1,
  kind: 'film' as const,
  title: 'Матрица',
  year: 1999,
  rating: 8,
  genres: ['фантастика'],
  posterUrl: null,
};

function seed(actorId: number): void {
  recordsStore.handle(actorId).upsert({
    id: 10,
    movie,
    rating: 8,
    watchedAt: '2026-01-01',
  });
  watchlistStore.handle(actorId).upsert({ id: 11, movie, addedAt: '2026-01-01' });
}

function counts(actorId: number): { records: number; watchlist: number } {
  return {
    records: recordsStore.handle(actorId).getSnapshot().length,
    watchlist: watchlistStore.handle(actorId).getSnapshot().length,
  };
}

afterEach(() => {
  resetListStores();
});

describe('ListStoreProvider actor switching', () => {
  it('keeps the lists when the same actor answers again', async () => {
    const view = (actorId: number) => (
      <ListStoreProvider actorId={actorId}>
        <span />
      </ListStoreProvider>
    );

    const { rerender } = render(view(1));
    seed(1);
    expect(counts(1)).toEqual({ records: 1, watchlist: 1 });

    rerender(view(1));
    await act(async () => undefined);
    expect(counts(1)).toEqual({ records: 1, watchlist: 1 });
  });

  it('resets the lists when the actor changes', async () => {
    const view = (actorId: number) => (
      <ListStoreProvider actorId={actorId}>
        <span />
      </ListStoreProvider>
    );

    const { rerender } = render(view(1));
    seed(1);
    seed(2);
    expect(counts(1)).toEqual({ records: 1, watchlist: 1 });
    expect(counts(2)).toEqual({ records: 1, watchlist: 1 });

    rerender(view(2));

    await waitFor(() => {
      expect(counts(1)).toEqual({ records: 0, watchlist: 0 });
      expect(counts(2)).toEqual({ records: 0, watchlist: 0 });
    });
  });

  it('does not clear slices when the actor id first appears', async () => {
    const view = (actorId: number) => (
      <ListStoreProvider actorId={actorId}>
        <span />
      </ListStoreProvider>
    );

    const { rerender } = render(view(0));
    seed(0);
    expect(counts(0)).toEqual({ records: 1, watchlist: 1 });

    rerender(view(7));
    await act(async () => undefined);
    expect(counts(0)).toEqual({ records: 1, watchlist: 1 });
  });
});
