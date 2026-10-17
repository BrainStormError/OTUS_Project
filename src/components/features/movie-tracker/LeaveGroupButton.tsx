'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

import { groupRead, invalidateReads, SOCIAL_READS } from './read-invalidation';

export function LeaveGroupButton({ groupId }: { groupId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/membership`, { method: 'DELETE' });
      if (response.ok) {
        void invalidateReads([...SOCIAL_READS, groupRead(groupId)]);
        toast.success('Вы покинули группу');
        router.push('/groups');
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
