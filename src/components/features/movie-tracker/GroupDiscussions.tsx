'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Timestamp } from '@/components/ui/timestamp';
import { useToast } from '@/components/ui/toast';
import type { DiscussionDetail, DiscussionSummary } from '@/modules/discussions';

import { groupRead, invalidateReads } from './read-invalidation';

function authorLabel(name: string | null, handle: string | null): string {
  return name ?? handle ?? 'Пользователь';
}

export function GroupDiscussions({
  groupId,
  isMember,
  isAdmin,
  discussions,
  activeDiscussion,
  onOpenDiscussion,
  onCloseDiscussion,
}: {
  groupId: number;
  isMember: boolean;
  isAdmin: boolean;
  discussions: DiscussionSummary[];
  activeDiscussion: DiscussionDetail | null;
  onOpenDiscussion: (id: number) => void;
  onCloseDiscussion: () => void;
}) {
  const toast = useToast();
  const titleId = useId();
  const commentId = useId();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Укажите название темы');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/discussions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) {
        setError('Не удалось создать обсуждение');
        toast.error('Не удалось создать обсуждение');
        return;
      }
      setTitle('');
      setCreating(false);
      toast.success('Обсуждение создано');
      void invalidateReads([groupRead(groupId)]);
    } catch {
      setError('Не удалось создать обсуждение');
      toast.error('Не удалось создать обсуждение');
    } finally {
      setPending(false);
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeDiscussion || !comment.trim()) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/discussions/${activeDiscussion.id}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: comment.trim() }),
      });
      if (!response.ok) {
        setError('Не удалось отправить комментарий');
        toast.error('Не удалось отправить комментарий');
        return;
      }
      setComment('');
      toast.success('Комментарий отправлен');
      void invalidateReads([groupRead(groupId)]);
    } catch {
      setError('Не удалось отправить комментарий');
      toast.error('Не удалось отправить комментарий');
    } finally {
      setPending(false);
    }
  }

  if (activeDiscussion) {
    return (
      <div className="space-y-4" data-testid="discussion-detail">
        <button
          type="button"
          onClick={onCloseDiscussion}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← К обсуждениям
        </button>
        <h2 className="text-lg font-medium">{activeDiscussion.title}</h2>
        <p className="text-xs text-muted-foreground">
          Автор: {authorLabel(activeDiscussion.authorName, activeDiscussion.authorHandle)}
        </p>

        {activeDiscussion.posts.length === 0 ? (
          <EmptyState
            title="Комментариев пока нет"
            description="Станьте первым, кто ответит в этой теме."
          />
        ) : (
          <ul data-testid="discussion-posts" className="space-y-3">
            {activeDiscussion.posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">
                  {authorLabel(post.authorName, post.authorHandle)}
                </p>
                <p className="text-sm text-muted-foreground">{post.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Timestamp value={post.createdAt} />
                </p>
              </li>
            ))}
          </ul>
        )}

        {isMember ? (
          <form className="space-y-2" onSubmit={submitComment}>
            <label htmlFor={commentId} className="text-sm font-medium">
              Комментарий
            </label>
            <Textarea
              id={commentId}
              value={comment}
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              Отправить
            </Button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreating(true)}>
            Создать обсуждение
          </Button>
        </div>
      ) : null}

      {discussions.length === 0 ? (
        <EmptyState
          title="Пока нет обсуждений"
          description="Администратор группы может создать первое обсуждение."
        />
      ) : (
        <ul
          data-testid="group-discussions"
          className="divide-y divide-border rounded-lg border border-border"
        >
          {discussions.map((discussion) => (
            <li key={discussion.id}>
              <button
                type="button"
                onClick={() => onOpenDiscussion(discussion.id)}
                className="flex min-h-14 w-full flex-wrap items-center justify-between gap-3 px-4 py-2 text-left transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{discussion.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {authorLabel(discussion.authorName, discussion.authorHandle)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Комментариев: {discussion.commentCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Новое обсуждение">
        <form className="space-y-3" onSubmit={submitCreate}>
          <label htmlFor={titleId} className="text-sm font-medium">
            Название темы
          </label>
          <Input
            id={titleId}
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              Создать
            </Button>
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
