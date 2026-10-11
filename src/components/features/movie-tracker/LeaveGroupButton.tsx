'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export function LeaveGroupButton({ groupId }: { groupId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/membership`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Вы покинули группу');
        router.push('/groups');
        router.refresh();
        return;
      }
      toast.error('Не удалось покинуть группу');
    } catch {
      toast.error('Не удалось покинуть группу');
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
