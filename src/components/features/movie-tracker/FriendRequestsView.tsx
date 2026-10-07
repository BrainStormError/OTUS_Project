'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

import { FriendListItem } from './FriendListItem';
import { FriendRequestItem } from './FriendRequestItem';
import { decideFriendship } from './social-actions';
import type { FriendRequest } from './types';

function decide(pending: FriendRequest[], userId: number, decision: 'accept' | 'decline') {
  const request = pending.find((item) => item.user.id === userId);
  if (request) {
    decideFriendship(request.id, decision);
  }
}

export function FriendRequestsView({
  incoming,
  outgoing,
}: {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}) {
  const [pending, setPending] = useState<FriendRequest[]>(incoming);
  const [sent, setSent] = useState<FriendRequest[]>(outgoing);

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-label="Входящие заявки">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Входящие</h2>
          <Badge aria-label={`Входящих заявок: ${pending.length}`}>{pending.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <EmptyState title="Входящих заявок нет" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {pending.map((request) => (
              <FriendRequestItem
                key={request.id}
                user={request.user}
                onAccept={(id) => {
                  decide(pending, id, 'accept');
                  setPending((prev) => prev.filter((item) => item.user.id !== id));
                }}
                onDecline={(id) => {
                  decide(pending, id, 'decline');
                  setPending((prev) => prev.filter((item) => item.user.id !== id));
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label="Исходящие заявки">
        <h2 className="text-lg font-medium">Исходящие</h2>
        {sent.length === 0 ? (
          <EmptyState title="Исходящих заявок нет" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sent.map((request) => (
              <FriendListItem
                key={request.id}
                user={request.user}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setSent((prev) => prev.filter((item) => item.id !== request.id))}
                  >
                    Отменить
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
