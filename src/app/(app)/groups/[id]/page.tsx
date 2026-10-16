import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toGroup } from '@/components/features/movie-tracker/adapters';
import { GroupTabs } from '@/components/features/movie-tracker/GroupTabs';
import { LeaveGroupButton } from '@/components/features/movie-tracker/LeaveGroupButton';
import { Button } from '@/components/ui/button';
import { getActor } from '@/modules/auth/session';
import { listGroupFeed, type FeedItem } from '@/modules/activity';
import { listDiscussionDetails, type DiscussionDetail } from '@/modules/discussions';
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

  const discussionsResult = await listDiscussionDetails(actor, groupId);
  const discussions: DiscussionDetail[] = discussionsResult.ok ? discussionsResult.value : [];

  const ratingsResult = await listGroupRatings(actor, groupId);
  const ratings: GroupRatingSummary[] = ratingsResult.ok ? ratingsResult.value : [];

  const activityVisible = Boolean(actor && isMember);
  let activityEvents: FeedItem[] = [];
  if (actor && isMember) {
    const feed = await listGroupFeed(actor, groupId, { limit: 20 });
    if (feed.ok) {
      activityEvents = feed.value.items;
    }
  }

  const discussionParam = single(query.discussion);
  const parsedDiscussion =
    discussionParam !== undefined && Number.isInteger(Number(discussionParam))
      ? Number(discussionParam)
      : null;

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

      <GroupTabs
        groupId={group.id}
        group={group}
        isMember={isMember}
        isAdmin={isAdmin}
        currentUserId={actor?.id}
        discussions={discussions}
        ratings={ratings}
        activityEvents={activityEvents}
        activityVisible={activityVisible}
        initialTab={single(query.tab)}
        initialDiscussionId={parsedDiscussion}
      />
    </div>
  );
}
