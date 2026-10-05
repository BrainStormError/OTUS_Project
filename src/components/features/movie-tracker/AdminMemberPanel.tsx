'use client';

import { Trash2, UserPlus } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestrictedState } from '@/components/ui/restricted-state';

import type { Group, GroupMember } from './types';

export function AdminMemberPanel({
  group,
  isAdmin,
}: {
  group: Group;
  isAdmin: boolean;
}) {
  const inviteId = useId();
  const [members, setMembers] = useState<GroupMember[]>(group.members);
  const [handle, setHandle] = useState('');

  if (!isAdmin) {
    return <RestrictedState kind="no-permission" />;
  }

  function changeRole(id: string, role: GroupMember['role']) {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  }

  function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = handle.trim().replace(/^@/, '');
    if (!value) return;
    setMembers((prev) => [
      ...prev,
      { id: `invited-${value}`, name: value, handle: value, role: 'member' },
    ]);
    setHandle('');
  }

  return (
    <div className="space-y-4" data-testid="admin-member-panel">
      <form className="flex items-end gap-2" onSubmit={invite}>
        <label htmlFor={inviteId} className="flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Пригласить по handle</span>
          <Input
            id={inviteId}
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="username"
          />
        </label>
        <Button type="submit">
          <UserPlus aria-hidden="true" className="mr-1 h-4 w-4" />
          Пригласить
        </Button>
      </form>

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
                onChange={(event) => changeRole(member.id, event.target.value as GroupMember['role'])}
                className="h-11 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <option value="admin">Администратор</option>
                <option value="member">Участник</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Удалить ${member.name} из группы`}
                onClick={() => removeMember(member.id)}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
