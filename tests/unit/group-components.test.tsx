import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { CreateGroupModal } from '@/components/features/movie-tracker/CreateGroupModal';
import { DissolveGroupButton } from '@/components/features/movie-tracker/DissolveGroupButton';
import { GroupInvitations } from '@/components/features/movie-tracker/GroupInvitations';
import { GroupSettingsForm } from '@/components/features/movie-tracker/GroupSettingsForm';
import { LeaveGroupButton } from '@/components/features/movie-tracker/LeaveGroupButton';
import { TagInput } from '@/components/features/movie-tracker/TagInput';
import type { Group } from '@/components/features/movie-tracker/types';
import type { GroupInvitation } from '@/modules/groups';

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/',
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function stubFetch(
  handler?: (url: URL, init?: RequestInit) => { ok: boolean; body?: unknown },
) {
  const mock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const result = handler?.(url, init) ?? { ok: true, body: { id: 1 } };
    return Promise.resolve({ ok: result.ok, json: async () => result.body ?? {} });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('TagInput', () => {
  it('adds chips on Enter and removes them', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<TagInput value={[]} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Теги'), 'пятница{Enter}');
    expect(onChange).toHaveBeenCalledWith(['пятница']);

    rerender(<TagInput value={['пятница', 'компания']} onChange={onChange} />);
    expect(screen.getByText('пятница')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Удалить тег пятница'));
    expect(onChange).toHaveBeenCalledWith(['компания']);
  });

  it('dedups without regard to case and ignores blanks', async () => {
    const onChange = vi.fn();
    render(<TagInput value={['Ретро']} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Теги'), 'ретро{Enter}');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Теги'), '   {Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('CreateGroupModal', () => {
  it('creates a group and opens its page', async () => {
    const fetchMock = stubFetch(() => ({ ok: true, body: { id: 42 } }));
    render(<CreateGroupModal open onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Название'), 'Новая группа');
    await userEvent.click(screen.getByRole('button', { name: 'Создать группу' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/groups/42'));
    expect(fetchMock).toHaveBeenCalledWith('/api/groups', expect.objectContaining({ method: 'POST' }));
  });

  it('shows a duplicate-name error without navigating', async () => {
    stubFetch(() => ({ ok: false, body: { error: 'Группа с таким названием уже существует' } }));
    render(<CreateGroupModal open onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Название'), 'Классика');
    await userEvent.click(screen.getByRole('button', { name: 'Создать группу' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Группа с таким названием уже существует',
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('GroupInvitations', () => {
  it('accepts an invitation and removes it locally', async () => {
    const fetchMock = stubFetch();
    render(
      <GroupInvitations
        invitations={[
          {
            id: 7,
            groupId: 3,
            groupName: 'Классика',
            inviterName: 'Алексей',
            inviterHandle: 'me',
          },
        ]}
      />,
    );

    expect(screen.getByText('Классика')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Принять приглашение в Классика' }));

    expect(screen.queryByText('Классика')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/invitations/7',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('renders nothing without pending invitations', () => {
    const { container } = render(<GroupInvitations invitations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('GroupSettingsForm', () => {
  it('saves edited settings and shows saved state', async () => {
    const fetchMock = stubFetch();
    render(
      <GroupSettingsForm
        group={{ id: 5, name: 'Классика', description: 'Старое', tags: ['ретро'], restricted: false }}
      />,
    );

    const name = screen.getByLabelText('Название');
    expect(name).toHaveValue('Классика');
    await userEvent.clear(name);
    await userEvent.type(name, 'Новая классика');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText('Сохранено')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/5',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('shows an error when saving fails', async () => {
    stubFetch(() => ({ ok: false }));
    render(<GroupSettingsForm group={{ id: 5, name: 'Классика', tags: [] }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить');
  });
});

const memberGroup: Group = {
  id: 5,
  name: 'Киновечера',
  tags: [],
  members: [{ id: 1, name: 'Алексей', handle: 'me', role: 'admin' }],
  stats: { count: 0, genres: [], years: [] },
};

const pendingInvitation: GroupInvitation = {
  id: 50,
  groupId: 5,
  groupName: 'Киновечера',
  inviterId: 1,
  inviterName: 'Алексей',
  inviterHandle: 'me',
  inviteeId: 9,
  inviteeName: 'Нина',
  inviteeHandle: 'nina',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminMemberPanel', () => {
  it('shows the no-permission state to a non-admin', () => {
    render(<AdminMemberPanel group={memberGroup} isAdmin={false} />);
    expect(screen.getByTestId('restricted-no-permission')).toBeInTheDocument();
  });

  it('invites a searched user, changes a role and removes a member', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.pathname === '/api/friendships/search') {
        return { ok: true, body: { items: [{ id: 9, name: 'Нина', handle: 'nina', relationship: 'none' }] } };
      }
      return { ok: true, body: { id: 1 } };
    });
    render(<AdminMemberPanel group={memberGroup} isAdmin invitations={[]} />);

    await userEvent.type(screen.getByLabelText('Поиск людей для приглашения'), 'Нина');
    await userEvent.click(await screen.findByRole('button', { name: 'Пригласить Нина' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/5/invitations',
      expect.objectContaining({ method: 'POST' }),
    );

    await userEvent.selectOptions(screen.getByLabelText('Роль Алексей'), 'member');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/5/members/1',
      expect.objectContaining({ method: 'PATCH' }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Удалить Алексей из группы' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/5/members/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('lists pending invitations and withdraws one', async () => {
    const fetchMock = stubFetch();
    render(
      <AdminMemberPanel group={memberGroup} isAdmin invitations={[pendingInvitation]} />,
    );

    const section = screen.getByRole('region', { name: 'Ожидающие приглашения' });
    expect(within(section).getByText('Нина')).toBeInTheDocument();

    await userEvent.click(within(section).getByRole('button', { name: 'Отозвать приглашение для Нина' }));
    expect(screen.queryByRole('region', { name: 'Ожидающие приглашения' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/invitations/50',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('does not offer removing the administrator themselves', () => {
    const twoMemberGroup: Group = {
      ...memberGroup,
      members: [
        { id: 1, name: 'Алексей', handle: 'me', role: 'admin' },
        { id: 2, name: 'Нина', handle: 'nina', role: 'member' },
      ],
    };
    render(<AdminMemberPanel group={twoMemberGroup} isAdmin currentUserId={1} />);

    expect(
      screen.queryByRole('button', { name: 'Удалить Алексей из группы' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить Нина из группы' })).toBeInTheDocument();
  });

  it('shows a pending invitee as sent and blocks a second invitation', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.pathname === '/api/friendships/search') {
        return {
          ok: true,
          body: { items: [{ id: 9, name: 'Нина', handle: 'nina', relationship: 'none' }] },
        };
      }
      return { ok: true, body: { id: 1 } };
    });
    render(<AdminMemberPanel group={memberGroup} isAdmin invitations={[pendingInvitation]} />);

    await userEvent.type(screen.getByLabelText('Поиск людей для приглашения'), 'Нина');
    const sentButton = await screen.findByRole('button', { name: 'Отправлено' });
    expect(sentButton).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Пригласить Нина' })).not.toBeInTheDocument();

    await userEvent.click(sentButton);
    expect(fetchMock).not.toHaveBeenCalledWith('/api/groups/5/invitations', expect.anything());
  });

  it('switches an invite action to sent after sending', async () => {
    stubFetch((url) => {
      if (url.pathname === '/api/friendships/search') {
        return {
          ok: true,
          body: { items: [{ id: 10, name: 'Пётр', handle: 'petr', relationship: 'none' }] },
        };
      }
      return { ok: true, body: { id: 1 } };
    });
    render(<AdminMemberPanel group={memberGroup} isAdmin invitations={[]} />);

    await userEvent.type(screen.getByLabelText('Поиск людей для приглашения'), 'Пётр');
    await userEvent.click(await screen.findByRole('button', { name: 'Пригласить Пётр' }));

    expect(await screen.findByRole('button', { name: 'Отправлено' })).toBeDisabled();
  });
});

describe('LeaveGroupButton', () => {
  it('leaves the group and returns to the group list', async () => {
    const fetchMock = stubFetch(() => ({ ok: true }));
    render(<LeaveGroupButton groupId={5} />);

    await userEvent.click(screen.getByRole('button', { name: 'Покинуть группу' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/groups'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/5/membership',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('DissolveGroupButton', () => {
  it('requires confirmation, then dissolves and returns to the group list', async () => {
    const fetchMock = stubFetch(() => ({ ok: true }));
    render(<DissolveGroupButton groupId={5} />);

    await userEvent.click(screen.getByRole('button', { name: 'Распустить группу' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить роспуск' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/groups'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/5',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
