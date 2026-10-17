'use client';

import { toWatchedRecord, toWatchlistItem } from '@/components/features/movie-tracker/adapters';
import { recordsStore, watchlistStore } from '@/components/features/movie-tracker/list-store';
import { loadRead, getReadState } from '@/components/features/movie-tracker/read-store';
import type { RatingEntry } from '@/modules/ratings';
import type { WatchlistEntry } from '@/modules/watchlist';

const IDENTITY = '/api/me/identity';
const RECORDS = '/api/records';
const WATCHLIST_FILMS = '/api/watchlist?kind=film';
const WATCHLIST_SERIES = '/api/watchlist?kind=series';
const FRIENDS = '/api/friendships';
const GROUPS = '/api/groups';
const SETTINGS = '/api/me/privacy';

export const SESSION_READS = [
  IDENTITY,
  RECORDS,
  WATCHLIST_FILMS,
  WATCHLIST_SERIES,
  FRIENDS,
  GROUPS,
  SETTINGS,
] as const;

type Items<T> = { items?: T[] };

function itemsOf<T>(url: string): T[] | null {
  const state = getReadState<Items<T>>(url);
  if (state.status !== 'ready' || !Array.isArray(state.data.items)) {
    return null;
  }
  return state.data.items;
}

function actorId(): number | null {
  const state = getReadState<{ id?: unknown }>(IDENTITY);
  if (state.status !== 'ready' || typeof state.data.id !== 'number') {
    return null;
  }
  return state.data.id;
}

// The list stores stay the mutation source of truth; the session's loaded
// reads are reconciled into them so the screens can render from the store.
function reconcileListStores(): void {
  const actor = actorId();
  if (actor === null) {
    return;
  }
  const records = itemsOf<RatingEntry>(RECORDS);
  if (records) {
    recordsStore.handle(actor).reconcile(records.map(toWatchedRecord), () => true);
  }
  const films = itemsOf<WatchlistEntry>(WATCHLIST_FILMS);
  if (films) {
    watchlistStore
      .handle(actor)
      .reconcile(
        films.map(toWatchlistItem),
        (item) => item.movie.kind === 'film',
      );
  }
  const series = itemsOf<WatchlistEntry>(WATCHLIST_SERIES);
  if (series) {
    watchlistStore
      .handle(actor)
      .reconcile(
        series.map(toWatchlistItem),
        (item) => item.movie.kind === 'series',
      );
  }
}

// Hydrates the read store once per session: every read loads at most one time,
// so repeated calls from the shell are free after the first one.
export function loadSession(): Promise<void> {
  return Promise.all(SESSION_READS.map((url) => loadRead(url))).then(() => {
    reconcileListStores();
  });
}
