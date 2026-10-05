'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';

import { FriendListItem } from './FriendListItem';
import { FriendRequestItem } from './FriendRequestItem';
import { searchFriends } from './data';
import { decideFriendship } from './social-actions';
import type { FriendRequest, PublicUser } from './types';

export function FriendsView({
  initialRequests,
  initialFriends,
}: {
  initialRequests: FriendRequest[];
  initialFriends: PublicUser[];
}) {
  const [requests, setRequests] = useState<FriendRequest[]>(initialRequests);
  const [friends, setFriends] = useState<PublicUser[]>(initialFriends);
  const [query, setQuery] = useState('');
  const results = searchFriends(query, friends);

  function accept(id: string) {
    const request = requests.find((item) => item.user.id === id);
    if (!request) return;
    decideFriendship(request.id, 'accept');
    setFriends((prev) => [...prev, { ...request.user, isFriend: true }]);
    setRequests((prev) => prev.filter((item) => item.user.id !== id));
  }

  function decline(id: string) {
    const request = requests.find((item) => item.user.id === id);
    if (request) {
      decideFriendship(request.id, 'decline');
    }
    setRequests((prev) => prev.filter((item) => item.user.id !== id));
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
        {query.trim() ? (
          results.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground">
              Никого не найдено
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {results.map((user) => (
                <FriendListItem
                  key={user.id}
                  user={user}
                  action={
                    <Button size="sm" variant="outline" type="button">
                      Добавить
                    </Button>
                  }
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
