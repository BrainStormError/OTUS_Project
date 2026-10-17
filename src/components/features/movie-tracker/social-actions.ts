import type { UserSearchResult } from '@/modules/friendships';

import { invalidateReads, SOCIAL_READS } from './read-invalidation';

export type { UserSearchResult };

type Decision = 'accept' | 'decline';

async function requestJson(url: string, method: string, body?: unknown): Promise<boolean> {
  if (typeof fetch !== 'function') {
    return false;
  }
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.ok) {
      void invalidateReads(SOCIAL_READS);
    }
    return response.ok;
  } catch {
    return false;
  }
}

export function decideFriendship(friendshipId: number, decision: Decision): Promise<boolean> {
  return requestJson(`/api/friendships/${decision}`, 'POST', { friendshipId });
}

export function sendFriendRequest(addresseeId: number): Promise<boolean> {
  return requestJson('/api/friendships', 'POST', { addresseeId });
}

export function withdrawFriendRequest(friendshipId: number): Promise<boolean> {
  return requestJson(`/api/friendships/${friendshipId}`, 'DELETE');
}

export function removeFriend(friendshipId: number): Promise<boolean> {
  return requestJson('/api/friendships/remove', 'POST', { friendshipId });
}

export async function searchUsers(
  query: string,
  signal?: AbortSignal,
): Promise<UserSearchResult[]> {
  const response = await fetch(
    `/api/friendships/search?q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error('Не удалось выполнить поиск');
  }
  const data = (await response.json()) as { items?: UserSearchResult[] };
  return data.items ?? [];
}

export function joinGroupRemote(groupId: number): Promise<boolean> {
  return requestJson('/api/groups/join', 'POST', { groupId });
}
