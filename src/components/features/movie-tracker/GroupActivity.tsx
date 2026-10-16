'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RestrictedState } from '@/components/ui/restricted-state';
import { Timestamp } from '@/components/ui/timestamp';
import type { FeedItem } from '@/modules/activity';

const FALLBACK_NAME = 'Пользователь';

function actionLabel(event: FeedItem): string {
  switch (event.kind) {
    case 'film_rated':
    case 'series_rated': {
      const rating = event.rating !== null ? ` — ${event.rating}` : '';
      return `оценил(а) «${event.title ?? 'медиа'}»${rating}`;
    }
    case 'post_created':
      return `создал(а) обсуждение «${event.title ?? ''}»`;
    case 'group_joined':
      return 'вступил(а) в группу';
    default:
      return 'активность';
  }
}

function isRating(event: FeedItem): boolean {
  return event.kind === 'film_rated' || event.kind === 'series_rated';
}

export function GroupActivity({
  events,
  visible,
  onOpenDiscussion,
}: {
  events: FeedItem[];
  visible: boolean;
  onOpenDiscussion: (id: number) => void;
}) {
  if (!visible) {
    return <RestrictedState kind="no-permission" />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="Пока нет активности"
        description="События группы появятся здесь, как только участники начнут оценивать и обсуждать."
      />
    );
  }

  return (
    <ul
      data-testid="group-activity"
      className="divide-y divide-border rounded-lg border border-border"
    >
      {events.map((event) => (
        <li
          key={event.id}
          className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {event.actorName ?? FALLBACK_NAME}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {actionLabel(event)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <Timestamp value={event.createdAt} />
            {isRating(event) && event.discussionId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenDiscussion(event.discussionId as number)}
              >
                К обсуждению
              </Button>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
