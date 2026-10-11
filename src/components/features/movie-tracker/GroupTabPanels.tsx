import { Suspense, type ReactNode } from 'react';

import type { Actor } from '@/core/auth/policy';
import { listGroupFeed, type FeedItem } from '@/modules/activity';
import {
  getDiscussion,
  listDiscussions,
  type DiscussionDetail,
  type DiscussionSummary,
} from '@/modules/discussions';
import { listGroupRatings, type GroupRatingSummary } from '@/modules/groups';

import { GroupActivity } from './GroupActivity';
import { GroupDiscussions } from './GroupDiscussions';
import { GroupRatings } from './GroupRatings';
import type { GroupTabId } from './GroupTabs';
import { GroupTabSkeleton } from './GroupTabSkeleton';

export function GroupTabPanel({
  tab,
  children,
}: {
  tab: GroupTabId;
  children: ReactNode;
}) {
  return (
    <Suspense key={tab} fallback={<GroupTabSkeleton tab={tab} />}>
      {children}
    </Suspense>
  );
}

export async function DiscussionsPanel({
  actor,
  groupId,
  isMember,
  isAdmin,
  discussionId,
}: {
  actor: Actor | null;
  groupId: number;
  isMember: boolean;
  isAdmin: boolean;
  discussionId?: number;
}) {
  let discussions: DiscussionSummary[] = [];
  let activeDiscussion: DiscussionDetail | null = null;

  const list = await listDiscussions(actor, groupId);
  if (list.ok) {
    discussions = list.value;
  }

  if (discussionId !== undefined && Number.isInteger(discussionId)) {
    const detail = await getDiscussion(actor, discussionId, groupId);
    if (detail.ok) {
      activeDiscussion = detail.value;
    }
  }

  return (
    <GroupDiscussions
      groupId={groupId}
      isMember={isMember}
      isAdmin={isAdmin}
      discussions={discussions}
      activeDiscussion={activeDiscussion}
    />
  );
}

export async function RatingsPanel({
  actor,
  groupId,
  isMember,
  isAdmin,
}: {
  actor: Actor | null;
  groupId: number;
  isMember: boolean;
  isAdmin: boolean;
}) {
  let ratings: GroupRatingSummary[] = [];

  const list = await listGroupRatings(actor, groupId);
  if (list.ok) {
    ratings = list.value;
  }

  return (
    <GroupRatings
      groupId={groupId}
      isMember={isMember}
      isAdmin={isAdmin}
      currentUserId={actor?.id}
      ratings={ratings}
    />
  );
}

export async function ActivityPanel({
  actor,
  groupId,
  isMember,
}: {
  actor: Actor | null;
  groupId: number;
  isMember: boolean;
}) {
  const visible = Boolean(actor && isMember);
  let events: FeedItem[] = [];

  if (actor && isMember) {
    const feed = await listGroupFeed(actor, groupId, { limit: 20 });
    if (feed.ok) {
      events = feed.value.items;
    }
  }

  return <GroupActivity groupId={groupId} events={events} visible={visible} />;
}
