'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Timestamp } from '@/components/ui/timestamp';

import type { FeedSource } from './feed';
import { useFeed } from './feed-stream';

const SOURCE_LABEL: Record<FeedSource, string> = {
  friend: 'Друг',
  group: 'Группа',
  you: 'Вы',
};

const SIZES = [5, 10, 25] as const;
const ROW_HEIGHT_REM = 4.5;

export function SocialFeed() {
  const { events, connected, loading, pending, markSeen } = useFeed();
  const [size, setSize] = useState<number>(SIZES[0]);
  const listRef = useRef<HTMLUListElement>(null);

  if (loading && events.length === 0) {
    return null;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="Пока нет активности"
        description="Добавьте друзей или вступите в группу, чтобы видеть их просмотры."
      />
    );
  }

  function showNew() {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    markSeen();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Количество записей" className="flex gap-2">
          {SIZES.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={option === size ? 'default' : 'outline'}
              aria-pressed={option === size}
              onClick={() => setSize(option)}
              className="min-w-11"
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 ? (
            <Button type="button" size="sm" onClick={showNew}>
              Новые записи: {pending}
            </Button>
          ) : null}
          <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {connected ? 'Обновляется в реальном времени' : 'Обновление при подключении'}
          </span>
        </div>
      </div>

      <ul
        ref={listRef}
        data-testid="social-feed"
        data-size={size}
        style={{ maxHeight: `${size * ROW_HEIGHT_REM}rem` }}
        aria-live="polite"
        className="divide-y divide-border overflow-y-auto rounded-lg border border-border"
      >
        {events.map((event) => (
          <li
            key={event.id}
            style={{ height: `${ROW_HEIGHT_REM}rem` }}
            className="flex items-center justify-between gap-3 px-4"
          >
            <Link
              href={event.href}
              prefetch={false}
              className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Badge>{SOURCE_LABEL[event.source]}</Badge>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{event.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {event.sourceName} · {event.action}
                </span>
              </span>
            </Link>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              {event.rating !== null ? (
                <>
                  <Star aria-hidden="true" className="h-3.5 w-3.5 text-accent-foreground" />
                  {event.rating.toFixed(1)}
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <Timestamp value={event.createdAt} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
