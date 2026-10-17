import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GroupInvitations } from '@/components/features/movie-tracker/GroupInvitations';
import { GroupSettingsForm } from '@/components/features/movie-tracker/GroupSettingsForm';
import { ToastProvider } from '@/components/ui/toast';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
  usePathname: () => '/groups/5',
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function stubFetch(ok: boolean, body?: unknown) {
  const mock = vi.fn(() => Promise.resolve({ ok, json: async () => body ?? { id: 1 } }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('GroupSettingsForm feedback', () => {
  it('shows a success toast and keeps the inline saved state', async () => {
    stubFetch(true);
    render(
      <ToastProvider>
        <GroupSettingsForm group={{ id: 5, name: 'Классика', tags: [] }} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Настройки сохранены');
    expect(screen.getByText('Сохранено')).toBeInTheDocument();
  });

  it('shows an error toast and keeps the inline error on failure', async () => {
    stubFetch(false);
    render(
      <ToastProvider>
        <GroupSettingsForm group={{ id: 5, name: 'Классика', tags: [] }} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить');
  });
});

describe('GroupInvitations feedback', () => {
  const invitation = {
    id: 7,
    groupId: 3,
    groupName: 'Классика',
    inviterName: 'Алексей',
    inviterHandle: 'me',
  };

  it('shows a success toast when accepting an invitation', async () => {
    stubFetch(true);
    render(
      <ToastProvider>
        <GroupInvitations invitations={[invitation]} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Принять приглашение в Классика' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Приглашение принято');
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('restores the invitation and shows an error toast when the decision fails', async () => {
    stubFetch(false);
    render(
      <ToastProvider>
        <GroupInvitations invitations={[invitation]} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Принять приглашение в Классика' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось обработать приглашение');
    expect(refreshMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Принять приглашение в Классика' }),
      ).toBeInTheDocument(),
    );
  });
});
