'use client';

import { UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

import type { RelationshipStatus } from '@/modules/friendships';

import { removeFriend, sendFriendRequest } from './social-actions';

export function FriendActionButton({
  userId,
  relationship,
  friendshipId = null,
  name,
  onAdd,
  onRemove,
}: {
  userId: number;
  relationship: RelationshipStatus;
  friendshipId?: number | null;
  name?: string;
  onAdd?: (userId: number) => void;
  onRemove?: (friendshipId: number) => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<RelationshipStatus>(relationship);
  const [prevRelationship, setPrevRelationship] = useState<RelationshipStatus>(relationship);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (relationship !== prevRelationship) {
    setPrevRelationship(relationship);
    setStatus(relationship);
  }

  async function add() {
    if (onAdd) {
      onAdd(userId);
      return;
    }
    setPending(true);
    const success = await sendFriendRequest(userId);
    setPending(false);
    if (success) {
      setStatus('pending_out');
      toast.success('Заявка отправлена');
      return;
    }
    toast.error('Не удалось отправить заявку');
  }

  async function remove() {
    setConfirming(false);
    if (onRemove) {
      if (friendshipId !== null) {
        onRemove(friendshipId);
      }
      return;
    }
    if (friendshipId === null) {
      return;
    }
    setPending(true);
    const success = await removeFriend(friendshipId);
    setPending(false);
    if (success) {
      setStatus('none');
      toast.success('Друг удалён');
      return;
    }
    toast.error('Не удалось удалить друга');
  }

  if (status === 'pending_out') {
    return <Badge>Заявка отправлена</Badge>;
  }

  if (status === 'pending_in') {
    return <Badge>Ожидает ответа</Badge>;
  }

  if (status === 'none') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={add}
        disabled={pending}
        aria-label={name ? `Добавить ${name}` : undefined}
      >
        <UserPlus aria-hidden="true" className="mr-1 h-4 w-4" />
        Добавить в друзья
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label={name ? `Убрать ${name} из друзей` : undefined}
      >
        <UserMinus aria-hidden="true" className="mr-1 h-4 w-4" />
        Убрать из друзей
      </Button>
      <Modal open={confirming} onClose={() => setConfirming(false)} title="Убрать из друзей">
        <p className="text-sm text-muted-foreground">
          Пользователь будет удалён из друзей. Продолжить?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
            Отмена
          </Button>
          <Button type="button" variant="destructive" onClick={remove}>
            Убрать
          </Button>
        </div>
      </Modal>
    </>
  );
}
