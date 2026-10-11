'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function LeaveGroupButton({ groupId }: { groupId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/membership`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/groups');
        router.refresh();
      }
    } catch {
      // The user can retry from the same control.
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={leave}>
      Покинуть группу
    </Button>
  );
}
