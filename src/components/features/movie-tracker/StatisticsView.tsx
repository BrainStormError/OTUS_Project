import { BarChart3, CalendarDays, Clapperboard } from 'lucide-react';

import { RestrictedState } from '@/components/ui/restricted-state';

import { StatCard } from './StatCard';
import type { UserStats } from './types';

export function StatisticsView({
  stats,
  restricted = false,
}: {
  stats: UserStats;
  restricted?: boolean;
}) {
  if (restricted) {
    return <RestrictedState kind="statistics" />;
  }

  const topGenre = stats.genres[0];
  const topYear = stats.years[0];

  return (
    <div className="space-y-6" data-testid="statistics">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Всего фильмов" value={stats.count} icon={Clapperboard} />
        <StatCard
          label="Любимый жанр"
          value={topGenre ? topGenre.genre : '—'}
          hint={topGenre ? `${topGenre.count} фильмов` : undefined}
          icon={BarChart3}
        />
        <StatCard
          label="Любимый год"
          value={topYear ? topYear.year : '—'}
          hint={topYear ? `${topYear.count} фильмов` : undefined}
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-label="Распределение по жанрам" className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-medium">По жанрам</h2>
          {stats.genres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ul className="space-y-2">
              {stats.genres.map((item) => (
                <li key={item.genre} className="flex items-center justify-between text-sm">
                  <span>{item.genre}</span>
                  <span className="tabular-nums text-muted-foreground">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-label="Распределение по годам" className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-medium">По годам</h2>
          {stats.years.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ul className="space-y-2">
              {stats.years.map((item) => (
                <li key={item.year} className="flex items-center justify-between text-sm">
                  <span>{item.year}</span>
                  <span className="tabular-nums text-muted-foreground">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
