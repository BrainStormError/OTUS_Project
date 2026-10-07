'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';

import { FriendListItem } from './FriendListItem';
import { FriendRequestItem } from './FriendRequestItem';
import {
  decideFriendship,
  searchUsers,
  sendFriendRequest,
  withdrawFriendRequest,
} from './social-actions';
import type { UserSearchResult } from './social-actions';
import type { FriendRequest, PublicUser } from './types';

const SEARCH_DEBOUNCE_MS = 300;

function resultAction(
  result: UserSearchResult,
  onAdd: (id: number) => void,
): React.ReactNode {
  switch (result.relationship) {
    case 'friend':
      return <Badge>Друг</Badge>;
    case 'pending_out':
      return <Badge>Заявка отправлена</Badge>;
    case 'pending_in':
      return <Badge>Ожидает ответа</Badge>;
    case 'none':
      return (
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => onAdd(result.id)}
          aria-label={`Добавить ${result.name}`}
        >
          Добавить
        </Button>
      );
  }
}

export function FriendsView({
  initialRequests,
  initialOutgoing = [],
  initialFriends,
}: {
  initialRequests: FriendRequest[];
  initialOutgoing?: FriendRequest[];
  initialFriends: PublicUser[];
}) {
  const [requests, setRequests] = useState<FriendRequest[]>(initialRequests);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>(initialOutgoing);
  const [friends, setFriends] = useState<PublicUser[]>(initialFriends);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<{ query: string; items: UserSearchResult[] } | null>(
    null,
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchUsers(trimmed, controller.signal)
        .then((items) => setSearch({ query: trimmed, items }))
        .catch(() => undefined);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const searchResults = search && search.query === query.trim() ? search.items : null;

  function accept(id: number) {
    const request = requests.find((item) => item.user.id === id);
    if (!request) return;
    decideFriendship(request.id, 'accept');
    setFriends((prev) => [...prev, { ...request.user, isFriend: true }]);
    setRequests((prev) => prev.filter((item) => item.user.id !== id));
  }

  function decline(id: number) {
    const request = requests.find((item) => item.user.id === id);
    if (request) {
      decideFriendship(request.id, 'decline');
    }
    setRequests((prev) => prev.filter((item) => item.user.id !== id));
  }

  function add(userId: number) {
    sendFriendRequest(userId);
    setSearch((prev) =>
      prev && prev.query === query.trim()
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === userId ? { ...item, relationship: 'pending_out' as const } : item,
            ),
          }
        : prev,
    );
  }

  function withdraw(id: number) {
    withdrawFriendRequest(id);
    setOutgoing((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-label="Поиск людей">
        <h2 className="text-lg font-medium">Поиск людей</h2>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Имя или @handle"
          aria-label="Поиск людей"
        />
        {query.trim() && searchResults ? (
          searchResults.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground">
              Никого не найдено
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {searchResults.map((user) => (
                <FriendListItem
                  key={user.id}
                  user={user}
                  action={resultAction(user, add)}
                />
              ))}
            </ul>
          )
        ) : null}
      </section>

      <section className="space-y-3" aria-label="Заявки в друзья">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Заявки</h2>
          <Badge aria-label={`Ожидающих заявок: ${requests.length}`}>
            {requests.length}
          </Badge>
        </div>
        {requests.length === 0 ? (
          <EmptyState
            title="Новых заявок нет"
            description="Когда кто-то захочет добавить вас, заявка появится здесь."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {requests.map((request) => (
              <FriendRequestItem
                key={request.id}
                user={request.user}
                onAccept={accept}
                onDecline={decline}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label="Исходящие заявки">
        <h2 className="text-lg font-medium">Исходящие</h2>
        {outgoing.length === 0 ? (
          <EmptyState
            title="Исходящих заявок нет"
            description="Отправленные вами заявки появятся здесь."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {outgoing.map((request) => (
              <FriendListItem
                key={request.id}
                user={request.user}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => withdraw(request.id)}
                    aria-label={`Отменить заявку для ${request.user.name}`}
                  >
                    Отменить
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label="Мои друзья">
        <h2 className="text-lg font-medium">Друзья</h2>
        {friends.length === 0 ? (
          <EmptyState
            title="Список друзей пуст"
            description="Отправьте заявку или примите входящую."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {friends.map((user) => (
              <FriendListItem key={user.id} user={user} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
