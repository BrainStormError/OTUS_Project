import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { RestrictedState } from '@/components/ui/restricted-state';

import { FriendActionButton } from './FriendActionButton';
import { EditableIdentity } from './EditableIdentity';
import { StatisticsView } from './StatisticsView';
import type { PublicUser } from './types';

export function ProfileView({ user, isOwn }: { user: PublicUser; isOwn: boolean }) {
  if (user.profileHidden && !isOwn) {
    return (
      <div className="space-y-3">
        <RestrictedState kind="profile" />
        <FriendActionButton
          userId={user.id}
          relationship={user.relationship ?? 'none'}
          friendshipId={user.friendshipId ?? null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isOwn ? (
        <EditableIdentity name={user.name} handle={user.handle} />
      ) : (
        <header className="flex flex-wrap items-center gap-4">
          <Avatar seed={user.handle} size={64} />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">@{user.handle}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <FriendActionButton
              userId={user.id}
              relationship={user.relationship ?? 'none'}
              friendshipId={user.friendshipId ?? null}
            />
          </div>
        </header>
      )}

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
                <Link href={`/film/${record.movie.tmdbId}`} prefetch={false} className="text-sm font-medium underline-offset-4 hover:underline">
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
