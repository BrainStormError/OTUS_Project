import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { GroupActivity } from '@/components/features/movie-tracker/GroupActivity';
import { GroupDiscussions } from '@/components/features/movie-tracker/GroupDiscussions';
import { GroupRatings } from '@/components/features/movie-tracker/GroupRatings';
import {
  GroupTabs,
  isGroupTabId,
  type GroupTabId,
} from '@/components/features/movie-tracker/GroupTabs';
import { StatisticsView } from '@/components/features/movie-tracker/StatisticsView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listGroupFeed, type FeedItem } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';
import {
  getDiscussion,
  listDiscussions,
  type DiscussionDetail,
  type DiscussionSummary,
} from '@/modules/discussions';
import { getGroup, canViewGroup, listGroupRatings, type GroupRatingSummary } from '@/modules/groups';

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

  let discussions: DiscussionSummary[] = [];
  let activeDiscussion: DiscussionDetail | null = null;
  let ratings: GroupRatingSummary[] = [];
  let events: FeedItem[] = [];

  if (active === 'discussions') {
    const list = await listDiscussions(actor, group.id);
    if (list.ok) {
      discussions = list.value;
    }
    if (discussionParam) {
      const discussionId = Number(discussionParam);
      if (Number.isInteger(discussionId)) {
        const detail = await getDiscussion(actor, discussionId, group.id);
        if (detail.ok) {
          activeDiscussion = detail.value;
        }
      }
    }
  } else if (active === 'ratings') {
    const list = await listGroupRatings(actor, group.id);
    if (list.ok) {
      ratings = list.value;
    }
  } else if (active === 'activity' && actor && isMember) {
    const feed = await listGroupFeed(actor, group.id, { limit: 20 });
    if (feed.ok) {
      events = feed.value.items;
    }
  }

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
        ) : null}
      </header>

      <GroupTabs groupId={group.id} active={active} />

      <section
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="space-y-4"
      >
        {active === 'discussions' ? (
          <GroupDiscussions
            groupId={group.id}
            isMember={isMember}
            isAdmin={isAdmin}
            discussions={discussions}
            activeDiscussion={activeDiscussion}
          />
        ) : null}

        {active === 'ratings' ? (
          <GroupRatings
            groupId={group.id}
            isMember={isMember}
            isAdmin={isAdmin}
            ratings={ratings}
          />
        ) : null}

        {active === 'activity' ? (
          <GroupActivity groupId={group.id} events={events} visible={Boolean(actor && isMember)} />
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
      </section>
    </div>
  );
}
