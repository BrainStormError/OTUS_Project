'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useShellIdentity } from '@/components/layout/shell-identity';
import type { FeedItem } from '@/modules/activity';
import type { DiscussionDetail } from '@/modules/discussions';
import type { GroupInvitation, GroupRatingSummary, GroupSummary } from '@/modules/groups';

import { toGroup } from '../adapters';
import { AdminMemberPanel } from '../AdminMemberPanel';
import { genreOptionsFromCatalog } from '../catalog-view';
import { DissolveGroupButton } from '../DissolveGroupButton';
import { GroupInvitations } from '../GroupInvitations';
import { GroupSettingsForm } from '../GroupSettingsForm';
import { GroupsView } from '../GroupsView';
import { GroupTabs } from '../GroupTabs';
import { LeaveGroupButton } from '../LeaveGroupButton';
import { groupRead } from '../read-invalidation';
import { useRead, useReadAll } from '../read-store';

type GenresRead = { items: { id: number; name: string }[] };

type GroupsRead = {
  groups: GroupSummary[];
  discover: GroupSummary[];
  invitations: GroupInvitation[];
};

type GroupRead = {
  group: GroupSummary;
  role: 'admin' | 'member' | null;
  discussions: DiscussionDetail[];
  ratings: GroupRatingSummary[];
  activity: FeedItem[];
  invitations: GroupInvitation[];
};

export function GroupsScreen() {
  const identity = useShellIdentity();
  const state = useRead<GroupsRead>('/api/groups');

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить группы." retry={state.retry} />
    );
  }

  return (
    <>
      <GroupInvitations
        invitations={state.data.invitations.map((invitation) => ({
          id: invitation.id,
          groupId: invitation.groupId,
          groupName: invitation.groupName,
          inviterName: invitation.inviterName,
          inviterHandle: invitation.inviterHandle,
        }))}
      />
      <GroupsView
        groups={state.data.groups.map(toGroup)}
        discoverGroups={state.data.discover.map(toGroup)}
        currentUserId={identity?.id}
      />
    </>
  );
}

export function GroupScreen({ groupId }: { groupId: number }) {
  const identity = useShellIdentity();
  const params = useSearchParams();
  const state = useRead<GroupRead>(groupRead(groupId));
  const genres = useReadAll<[GenresRead, GenresRead]>([
    '/api/genres?kind=film',
    '/api/genres?kind=series',
  ]);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return state.code === 404 ? (
      <EmptyState title="Группа не найдена" />
    ) : (
      <ErrorState message="Не удалось загрузить группу." retry={state.retry} />
    );
  }

  const { group: summary, role, discussions, ratings, activity } = state.data;
  const group = toGroup(summary);
  const isAdmin = role === 'admin';
  const isMember = role !== null;
  const genresByKind =
    genres.status === 'ready'
      ? {
          film: genreOptionsFromCatalog(genres.data[0].items),
          series: genreOptionsFromCatalog(genres.data[1].items),
        }
      : undefined;

  const discussionParam = params.get('discussion');
  const parsedDiscussion =
    discussionParam !== null && Number.isInteger(Number(discussionParam))
      ? Number(discussionParam)
      : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
          {group.description ? (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          ) : null}
        </div>
        {isAdmin ? (
          <Button asChild size="sm">
            <Link href={`/groups/${group.id}/admin`} prefetch={false}>Управление</Link>
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
        currentUserId={identity?.id}
        discussions={discussions}
        ratings={ratings}
        genresByKind={genresByKind}
        activityEvents={activity}
        activityVisible={isMember}
        initialTab={params.get('tab') ?? undefined}
        initialDiscussionId={parsedDiscussion}
      />
    </div>
  );
}

export function GroupAdminScreen({ groupId }: { groupId: number }) {
  const identity = useShellIdentity();
  const state = useRead<GroupRead>(groupRead(groupId));

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return state.code === 404 ? (
      <EmptyState title="Группа не найдена" />
    ) : (
      <ErrorState message="Не удалось загрузить управление группой." retry={state.retry} />
    );
  }

  const group = toGroup(state.data.group);
  const isAdmin = state.data.role === 'admin';

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Управление группой «{group.name}»
      </h1>
      {isAdmin ? <GroupSettingsForm group={group} /> : null}
      {isAdmin ? <DissolveGroupButton groupId={group.id} /> : null}
      <AdminMemberPanel
        group={group}
        isAdmin={isAdmin}
        currentUserId={identity?.id}
        invitations={state.data.invitations}
      />
    </>
  );
}
