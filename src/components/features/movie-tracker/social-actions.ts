type Decision = 'accept' | 'decline';

function postJson(url: string, body: unknown): void {
  if (typeof fetch !== 'function') {
    return;
  }
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  } catch {
    // The local view already reflects the optimistic update.
  }
}

export function decideFriendship(friendshipId: string, decision: Decision): void {
  postJson(`/api/friendships/${decision}`, { friendshipId });
}

export function joinGroupRemote(groupId: string): void {
  postJson('/api/groups/join', { groupId });
}
