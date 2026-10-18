'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import type { FeedItem } from '@/modules/activity';
import type { DiscussionDetail } from '@/modules/discussions';
import type { GroupRatingSummary } from '@/modules/groups';

import { GroupActivity } from './GroupActivity';
import { GroupDiscussions } from './GroupDiscussions';
import { GroupRatings } from './GroupRatings';
import { StatisticsView } from './StatisticsView';
import type { FilterOption, Group, MediaKind } from './types';

export const GROUP_TABS = [
  { id: 'discussions', label: 'Обсуждения' },
  { id: 'ratings', label: 'Оценки' },
  { id: 'activity', label: 'Активность' },
  { id: 'members', label: 'Участники' },
  { id: 'stats', label: 'Статистика' },
] as const;

export type GroupTabId = (typeof GROUP_TABS)[number]['id'];

export function isGroupTabId(value: string | undefined): value is GroupTabId {
  return GROUP_TABS.some((tab) => tab.id === value);
}

function groupUrl(groupId: number, tab: GroupTabId, discussionId: number | null): string {
  const params = new URLSearchParams({ tab });
  if (tab === 'discussions' && discussionId !== null) {
    params.set('discussion', String(discussionId));
  }
  return `/groups/${groupId}?${params.toString()}`;
}

export function GroupTabs({
  groupId,
  group,
  isMember,
  isAdmin,
  currentUserId,
  discussions,
  ratings,
  genresByKind,
  activityEvents,
  activityVisible,
  initialTab,
  initialDiscussionId,
}: {
  groupId: number;
  group: Group;
  isMember: boolean;
  isAdmin: boolean;
  currentUserId?: number;
  discussions: DiscussionDetail[];
  ratings: GroupRatingSummary[];
  genresByKind?: Record<MediaKind, FilterOption[]>;
  activityEvents: FeedItem[];
  activityVisible: boolean;
  initialTab?: string;
  initialDiscussionId: number | null;
}) {
  const [active, setActive] = useState<GroupTabId>(() =>
    isGroupTabId(initialTab) ? initialTab : 'discussions',
  );
  const [discussionId, setDiscussionId] = useState<number | null>(initialDiscussionId);

  function syncUrl(tab: GroupTabId, discussion: number | null) {
    if (typeof window === 'undefined') {
      return;
    }
    window.history.replaceState(null, '', groupUrl(groupId, tab, discussion));
  }

  function changeTab(tab: GroupTabId) {
    setActive(tab);
    setDiscussionId(null);
    syncUrl(tab, null);
  }

  function openDiscussion(id: number) {
    setActive('discussions');
    setDiscussionId(id);
    syncUrl('discussions', id);
  }

  function closeDiscussion() {
    setDiscussionId(null);
    syncUrl('discussions', null);
  }

  const activeDiscussion =
    discussionId !== null
      ? discussions.find((discussion) => discussion.id === discussionId) ?? null
      : null;

  return (
    <div className="space-y-4">
      <nav aria-label="Разделы группы">
        <ul role="tablist" className="-mb-px flex flex-wrap gap-1 border-b border-border">
          {GROUP_TABS.map((tab) => {
            const selected = tab.id === active;
            return (
              <li key={tab.id} role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => changeTab(tab.id)}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    selected
                      ? 'border-primary font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="space-y-4"
      >
        {active === 'discussions' ? (
          <GroupDiscussions
            groupId={groupId}
            isMember={isMember}
            isAdmin={isAdmin}
            discussions={discussions}
            activeDiscussion={activeDiscussion}
            onOpenDiscussion={openDiscussion}
            onCloseDiscussion={closeDiscussion}
          />
        ) : null}

        {active === 'ratings' ? (
          <GroupRatings
            groupId={groupId}
            isMember={isMember}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            ratings={ratings}
            genresByKind={genresByKind}
            onOpenDiscussion={openDiscussion}
          />
        ) : null}

        {active === 'activity' ? (
          <GroupActivity
            events={activityEvents}
            visible={activityVisible}
            onOpenDiscussion={openDiscussion}
          />
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
                  prefetch={false}
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
