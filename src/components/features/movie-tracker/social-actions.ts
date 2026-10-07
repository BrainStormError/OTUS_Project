import type { UserSearchResult } from '@/modules/friendships';

export type { UserSearchResult };

type Decision = 'accept' | 'decline';

function requestJson(url: string, method: string, body?: unknown): void {
  if (typeof fetch !== 'function') {
    return;
  }
  try {
    void fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => undefined);
  } catch {
    // The local view already reflects the optimistic update.
  }
}

export function decideFriendship(friendshipId: number, decision: Decision): void {
  requestJson(`/api/friendships/${decision}`, 'POST', { friendshipId });
}

export function sendFriendRequest(addresseeId: number): void {
  requestJson('/api/friendships', 'POST', { addresseeId });
}

export function withdrawFriendRequest(friendshipId: number): void {
  requestJson(`/api/friendships/${friendshipId}`, 'DELETE');
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

export function joinGroupRemote(groupId: number): void {
  requestJson('/api/groups/join', 'POST', { groupId });
}
