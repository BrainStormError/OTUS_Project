'use client';

import { Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestrictedState } from '@/components/ui/restricted-state';
import type { GroupInvitation } from '@/modules/groups';

import { searchUsers } from './social-actions';
import type { UserSearchResult } from './social-actions';
import type { Group, GroupMember } from './types';

const SEARCH_DEBOUNCE_MS = 300;

function postJson(url: string, method: string, body?: unknown): void {
  try {
    void fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => undefined);
  } catch {
    // The local view already reflects the optimistic update.
  }
}

export function AdminMemberPanel({
  group,
  isAdmin,
  currentUserId,
  invitations = [],
}: {
  group: Group;
  isAdmin: boolean;
  currentUserId?: number;
  invitations?: GroupInvitation[];
}) {
  const [members, setMembers] = useState<GroupMember[]>(group.members);
  const [pending, setPending] = useState<GroupInvitation[]>(invitations);
  const [sent, setSent] = useState<Set<number>>(
    () => new Set(invitations.map((invitation) => invitation.inviteeId)),
  );
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<{ query: string; items: UserSearchResult[] } | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchUsers(trimmed, controller.signal)
        .then((items) => setSearch({ query: trimmed, items }))
        .catch(() => undefined);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results = search && search.query === query.trim() ? search.items : null;

  if (!isAdmin) {
    return <RestrictedState kind="no-permission" />;
  }

  function changeRole(id: number, role: GroupMember['role']) {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));
    postJson(`/api/groups/${group.id}/members/${id}`, 'PATCH', { role });
  }

  function removeMember(id: number) {
    setMembers((prev) => prev.filter((member) => member.id !== id));
    postJson(`/api/groups/${group.id}/members/${id}`, 'DELETE');
  }

  function invite(user: UserSearchResult) {
    setSent((prev) => new Set(prev).add(user.id));
    setPending((prev) => [
      ...prev,
      {
        id: -user.id,
        groupId: group.id,
        groupName: group.name,
        inviterId: 0,
        inviterName: '',
        inviterHandle: '',
        inviteeId: user.id,
        inviteeName: user.name,
        inviteeHandle: user.handle,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);
    postJson(`/api/groups/${group.id}/invitations`, 'POST', { inviteeId: user.id });
  }

  function cancelInvitation(invitation: GroupInvitation) {
    setPending((prev) => prev.filter((entry) => entry.id !== invitation.id));
    setSent((prev) => {
      const next = new Set(prev);
      next.delete(invitation.inviteeId);
      return next;
    });
    postJson(`/api/groups/invitations/${invitation.id}`, 'DELETE');
  }

  return (
    <div className="space-y-6" data-testid="admin-member-panel">
      <section className="space-y-2" aria-label="Пригласить участника">
        <h2 className="text-lg font-medium">Пригласить в группу</h2>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Имя или @handle"
          aria-label="Поиск людей для приглашения"
        />
        {results ? (
          results.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground">
              Никого не найдено
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {results.map((user) => (
                <li
                  key={user.id}
                  className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{user.handle}</p>
                  </div>
                  {sent.has(user.id) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled
                    >
                      Отправлено
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Пригласить ${user.name}`}
                      onClick={() => invite(user)}
                    >
                      <UserPlus aria-hidden="true" className="mr-1 h-4 w-4" />
                      Пригласить
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      <section className="space-y-2" aria-label="Участники группы">
        <h2 className="text-lg font-medium">Участники</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{member.handle}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`role-${member.id}`}>
                  Роль {member.name}
                </label>
                <select
                  id={`role-${member.id}`}
                  value={member.role}
                  onChange={(event) =>
                    changeRole(member.id, event.target.value as GroupMember['role'])
                  }
                  className="h-11 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="admin">Администратор</option>
                  <option value="member">Участник</option>
                </select>
                {member.id !== currentUserId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Удалить ${member.name} из группы`}
                    onClick={() => removeMember(member.id)}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {pending.length > 0 ? (
        <section className="space-y-2" aria-label="Ожидающие приглашения">
          <h2 className="text-lg font-medium">Ожидающие приглашения</h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {pending.map((invitation) => (
              <li
                key={invitation.id}
                className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invitation.inviteeName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{invitation.inviteeHandle}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Отозвать приглашение для ${invitation.inviteeName}`}
                  onClick={() => cancelInvitation(invitation)}
                >
                  Отозвать
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
