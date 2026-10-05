'use client';

import { UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function AddFriendButton({ userId }: { userId: string }) {
  const [sent, setSent] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setSent(true)}
      disabled={sent}
      aria-label={sent ? 'Заявка отправлена' : 'Добавить в друзья'}
      data-user-id={userId}
    >
      <UserPlus aria-hidden="true" className="mr-1 h-4 w-4" />
      {sent ? 'Заявка отправлена' : 'Добавить в друзья'}
    </Button>
  );
}
