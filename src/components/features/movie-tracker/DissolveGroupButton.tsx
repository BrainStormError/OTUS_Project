'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

import { invalidateReads, SOCIAL_READS } from './read-invalidation';

export function DissolveGroupButton({ groupId }: { groupId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function dissolve() {
    setPending(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (response.ok) {
        void invalidateReads(SOCIAL_READS);
        toast.success('Группа распущена');
        router.push('/groups');
        return;
      }
      toast.error('Не удалось распустить группу');
    } catch {
      toast.error('Не удалось распустить группу');
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Распустить группу
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Группа и все её данные будут удалены.</span>
      <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={dissolve}>
        Подтвердить роспуск
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Отмена
      </Button>
    </div>
  );
}
