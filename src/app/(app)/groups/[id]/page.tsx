import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { StatisticsView } from '@/components/features/movie-tracker/StatisticsView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getActor } from '@/modules/auth/session';
import { getGroup } from '@/modules/groups';

export const dynamic = 'force-dynamic';

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getGroup(id);
  if (!result.ok) {
    notFound();
  }
  const group = toGroup(result.value);

  const actor = await getActor();
  const admin = actor
    ? group.members.some((member) => member.id === actor.id && member.role === 'admin')
    : false;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/groups" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Группы
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
          {group.description ? (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          ) : null}
        </div>
        {admin ? (
          <Button asChild size="sm">
            <Link href={`/groups/${group.id}/admin`}>Управление</Link>
          </Button>
        ) : null}
      </header>

      <section className="space-y-3" aria-label="Участники">
        <h2 className="text-lg font-medium">Участники</h2>
        <ul className="divide-y divide-border rounded-lg border border-border" data-testid="group-members">
          {group.members.map((member) => (
            <li key={member.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
              <Link href={`/u/${member.handle}`} className="text-sm font-medium underline-offset-4 hover:underline">
                {member.name}
              </Link>
              {member.role === 'admin' ? <Badge>Администратор</Badge> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-label="Статистика группы">
        <h2 className="text-lg font-medium">Статистика группы</h2>
        <StatisticsView stats={group.stats} />
      </section>
    </div>
  );
}
