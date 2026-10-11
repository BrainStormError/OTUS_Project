import type { MediaKind } from '@/modules/ratings';

export type RemoteWatchlistInput = {
  mediaKind: MediaKind;
  mediaRef: string;
};

export async function saveRemoteWatchlist(input: RemoteWatchlistInput): Promise<number | null> {
  if (typeof fetch !== 'function') {
    return null;
  }
  const response = await fetch('/api/watchlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json().catch(() => null)) as { id?: number } | null;
  return typeof data?.id === 'number' ? data.id : null;
}

export async function deleteRemoteWatchlist(id: number): Promise<boolean> {
  if (typeof fetch !== 'function') {
    return false;
  }
  const response = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
  return response.ok;
}
