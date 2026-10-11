import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import {
  ActivityPanel,
  DiscussionsPanel,
  GroupTabPanel,
  RatingsPanel,
} from '@/components/features/movie-tracker/GroupTabPanels';
import {
  GroupTabs,
  isGroupTabId,
  type GroupTabId,
} from '@/components/features/movie-tracker/GroupTabs';
import { LeaveGroupButton } from '@/components/features/movie-tracker/LeaveGroupButton';
import { StatisticsView } from '@/components/features/movie-tracker/StatisticsView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getActor } from '@/modules/auth/session';
import { getGroup, canViewGroup } from '@/modules/groups';

export const dynamic = 'force-dynamic';

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const groupId = Number(id);
  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const actor = await getActor();
  if (!(await canViewGroup(actor, groupId))) {
    notFound();
  }

  const result = await getGroup(actor, groupId);
  if (!result.ok) {
    notFound();
  }
  const group = toGroup(result.value);

  const membership = actor
    ? group.members.find((member) => member.id === actor.id)
    : undefined;
  const isMember = Boolean(membership);
  const isAdmin = membership?.role === 'admin';

  const tabParam = single(query.tab);
  const active: GroupTabId = isGroupTabId(tabParam) ? tabParam : 'discussions';
  const discussionParam = single(query.discussion);
  const discussionId = discussionParam ? Number(discussionParam) : undefined;

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
        {isAdmin ? (
          <Button asChild size="sm">
            <Link href={`/groups/${group.id}/admin`}>Управление</Link>
          </Button>
        ) : isMember ? (
          <LeaveGroupButton groupId={group.id} />
        ) : null}
      </header>

      <GroupTabs groupId={group.id} active={active} />

      <section
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="space-y-4"
      >
        <GroupTabPanel tab={active}>
          {active === 'discussions' ? (
            <DiscussionsPanel
              actor={actor}
              groupId={group.id}
              isMember={isMember}
              isAdmin={isAdmin}
              discussionId={discussionId}
            />
          ) : null}

          {active === 'ratings' ? (
            <RatingsPanel
              actor={actor}
              groupId={group.id}
              isMember={isMember}
              isAdmin={isAdmin}
            />
          ) : null}

          {active === 'activity' ? (
            <ActivityPanel actor={actor} groupId={group.id} isMember={isMember} />
          ) : null}

          {active === 'members' ? (
            <ul
              className="divide-y divide-border rounded-lg border border-border"
              data-testid="group-members"
            >
              {group.members.map((member) => (
                <li
                  key={member.id}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-2"
                >
                  <Link
                    href={`/u/${member.handle}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {member.name}
                  </Link>
                  {member.role === 'admin' ? <Badge>Администратор</Badge> : null}
                </li>
              ))}
            </ul>
          ) : null}

          {active === 'stats' ? <StatisticsView stats={group.stats} /> : null}
        </GroupTabPanel>
      </section>
    </div>
  );
}
