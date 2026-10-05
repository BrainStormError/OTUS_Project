'use client';

import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { FriendListItem } from './FriendListItem';
import type { PublicUser } from './types';

export function FriendRequestItem({
  user,
  onAccept,
  onDecline,
}: {
  user: Pick<PublicUser, 'id' | 'name' | 'handle'>;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}) {
  return (
    <FriendListItem
      user={user}
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            type="button"
            onClick={() => onAccept?.(user.id)}
            aria-label={`Принять заявку от ${user.name}`}
          >
            <Check aria-hidden="true" className="mr-1 h-4 w-4" />
            Принять
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => onDecline?.(user.id)}
            aria-label={`Отклонить заявку от ${user.name}`}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      }
    />
  );
}
