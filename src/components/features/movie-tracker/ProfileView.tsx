import Link from 'next/link';
import { UserRound } from 'lucide-react';

import { RestrictedState } from '@/components/ui/restricted-state';

import { AddFriendButton } from './AddFriendButton';
import { StatisticsView } from './StatisticsView';
import type { PublicUser } from './types';

export function ProfileView({ user, isOwn }: { user: PublicUser; isOwn: boolean }) {
  if (user.profileHidden && !isOwn) {
    return (
      <div className="space-y-3">
        <RestrictedState kind="profile" />
        <AddFriendButton userId={user.id} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <UserRound className="h-8 w-8" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">@{user.handle}</p>
        </div>
        {isOwn ? null : (
          <div className="ml-auto flex items-center gap-2">
            <AddFriendButton userId={user.id} />
          </div>
        )}
      </header>

      <section className="space-y-3" aria-label="Статистика профиля">
        <h2 className="text-lg font-medium">Статистика</h2>
        <StatisticsView stats={user.stats} restricted={Boolean(user.statsHidden) && !isOwn} />
      </section>

      <section className="space-y-3" aria-label="Активность">
        <h2 className="text-lg font-medium">Активность</h2>
        {user.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Записей пока нет.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {user.recent.map((record) => (
              <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={`/film/${record.movie.tmdbId}`} className="text-sm font-medium underline-offset-4 hover:underline">
                  {record.movie.title}
                </Link>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {record.rating > 0 ? record.rating.toFixed(1) : '—'}
                  {record.watchedAt ? ` · ${record.watchedAt}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
