'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

import { invalidateReads, SOCIAL_READS } from './read-invalidation';

export type GroupInvitationItem = {
  id: number;
  groupId: number;
  groupName: string;
  inviterName: string;
  inviterHandle: string;
};

export function GroupInvitations({ invitations }: { invitations: GroupInvitationItem[] }) {
  const [items, setItems] = useState(invitations);
  const toast = useToast();

  async function decide(id: number, decision: 'accept' | 'decline') {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      const response = await fetch(`/api/groups/invitations/${id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
        if (response.ok) {
          void invalidateReads(SOCIAL_READS);
        toast.success(decision === 'accept' ? 'Приглашение принято' : 'Приглашение отклонено');
        return;
      }
    } catch {
      // fall through to the rollback below
    }
    setItems(previous);
    toast.error('Не удалось обработать приглашение');
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Входящие приглашения"
      className="space-y-2 rounded-lg border border-border bg-card p-4"
    >
      <h2 className="text-lg font-medium">Приглашения в группы</h2>
      <ul className="divide-y divide-border">
        {items.map((invitation) => (
          <li
            key={invitation.id}
            className="flex min-h-14 flex-wrap items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{invitation.groupName}</p>
              <p className="truncate text-xs text-muted-foreground">
                Приглашает {invitation.inviterName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                aria-label={`Принять приглашение в ${invitation.groupName}`}
                onClick={() => decide(invitation.id, 'accept')}
              >
                Принять
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Отклонить приглашение в ${invitation.groupName}`}
                onClick={() => decide(invitation.id, 'decline')}
              >
                Отклонить
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
