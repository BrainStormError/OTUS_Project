'use client';

import { useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';

import { GroupCard } from './GroupCard';
import { searchGroups } from './data';
import { joinGroupRemote } from './social-actions';
import type { Group } from './types';

export function GroupsView({
  groups,
  discoverGroups,
  currentUserId,
}: {
  groups: Group[];
  discoverGroups?: Group[];
  currentUserId?: number;
}) {
  const [query, setQuery] = useState('');
  const results = searchGroups(query, groups, discoverGroups);
  const [joined, setJoined] = useState<number[]>([]);

  function isMember(group: Group): boolean {
    if (joined.includes(group.id)) return true;
    return currentUserId ? group.members.some((member) => member.id === currentUserId) : false;
  }

  function renderCard(group: Group) {
    const canJoin = Boolean(currentUserId) && !isMember(group);
    return (
      <GroupCard
        key={group.id}
        group={group}
        onJoin={
          canJoin
            ? () => {
                joinGroupRemote(group.id);
                setJoined((prev) => [...prev, group.id]);
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Название, описание или тег"
        aria-label="Поиск групп"
      />

      {query.trim() ? (
        results.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            Ничего не найдено
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Результаты поиска групп">
            {results.map(renderCard)}
          </div>
        )
      ) : groups.length === 0 ? (
        <EmptyState
          title="Вы не состоите в группах"
          description="Создайте группу или вступите по приглашению."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{groups.map(renderCard)}</div>
      )}
    </div>
  );
}
