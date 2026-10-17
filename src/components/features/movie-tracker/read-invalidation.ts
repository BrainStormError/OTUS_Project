import { storeRead } from './read-store';

const RECORDS = '/api/records';
const WATCHLIST_FILMS = '/api/watchlist?kind=film';
const WATCHLIST_SERIES = '/api/watchlist?kind=series';
const FRIENDS = '/api/friendships';
const GROUPS = '/api/groups';
const IDENTITY = '/api/me/identity';
const PRIVACY = '/api/me/privacy';
const PROFILE = '/api/me/profile';
const STATS = '/api/me/stats';

export const RECORDS_READS = [RECORDS, WATCHLIST_FILMS, WATCHLIST_SERIES, PROFILE, STATS];
export const WATCHLIST_READS = [WATCHLIST_FILMS, WATCHLIST_SERIES];
export const SOCIAL_READS = [FRIENDS, GROUPS];
export const IDENTITY_READS = [IDENTITY, PRIVACY, PROFILE, STATS];
export const PERSONAL_READS = [
  ...new Set([...RECORDS_READS, ...SOCIAL_READS, IDENTITY, PRIVACY, PROFILE]),
];

export function groupRead(groupId: number): string {
  return `${GROUPS}/${groupId}`;
}

export const groupReads = (groupId: number): string[] => [GROUPS, groupRead(groupId)];

export type SignalKind =
  | 'film_rated'
  | 'series_rated'
  | 'friendship_accepted'
  | 'group_joined'
  | 'friend_removed'
  | 'group_left'
  | 'group_removed'
  | 'group_dissolved';

export const READS_BY_SIGNAL: Record<SignalKind, string[]> = {
  film_rated: RECORDS_READS,
  series_rated: RECORDS_READS,
  friendship_accepted: SOCIAL_READS,
  friend_removed: SOCIAL_READS,
  group_joined: [...SOCIAL_READS, ...RECORDS_READS],
  group_left: [...SOCIAL_READS, ...RECORDS_READS],
  group_removed: [...SOCIAL_READS, ...RECORDS_READS],
  group_dissolved: [...SOCIAL_READS, ...RECORDS_READS],
};

export function readsForSignal(kind: SignalKind): string[] {
  return READS_BY_SIGNAL[kind] ?? [];
}

export function readsForActivity(kind: string, source: string): string[] {
  if (kind === 'film' || kind === 'series') {
    return source === 'you' ? readsForSignal(kind === 'film' ? 'film_rated' : 'series_rated') : [];
  }
  if (kind === 'friendship') {
    return readsForSignal('friendship_accepted');
  }
  if (kind === 'group') {
    return readsForSignal('group_joined');
  }
  return [];
}

export async function invalidateReads(urls: readonly string[]): Promise<void> {
  await Promise.all(
    urls.map((url) =>
      fetch(url, { cache: 'reload', headers: { accept: 'application/json' } })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data !== null) {
            storeRead(url, data);
          }
        })
        .catch(() => undefined),
    ),
  );
}
