import Link from 'next/link';
import { UserRound } from 'lucide-react';

import { cn } from '@/components/ui/utils';

import type { PublicUser } from './types';

export function FriendListItem({
  user,
  action,
  className,
}: {
  user: Pick<PublicUser, 'id' | 'name' | 'handle'>;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      data-testid="friend-item"
      className={cn(
        'flex min-h-14 items-center justify-between gap-3 border-b border-border px-1 py-2 last:border-b-0',
        className,
      )}
    >
      <Link
        href={`/u/${user.handle}`}
        className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <UserRound className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">@{user.handle}</span>
        </span>
      </Link>
      {action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
}
