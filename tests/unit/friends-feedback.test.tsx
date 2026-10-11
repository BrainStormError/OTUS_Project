import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FriendsView } from '@/components/features/movie-tracker/FriendsView';
import {
  decideFriendship,
  removeFriend,
  sendFriendRequest,
  withdrawFriendRequest,
} from '@/components/features/movie-tracker/social-actions';
import type { FriendRequest, PublicUser } from '@/components/features/movie-tracker/types';
import { ToastProvider } from '@/components/ui/toast';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

const ivan: PublicUser = {
  id: 2,
  handle: 'ivan',
  name: 'Иван',
  isFriend: false,
  stats: { count: 0, genres: [], years: [] },
  recent: [],
};

const request: FriendRequest = { id: 7, user: ivan };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function stubFetch(
  handler: (url: URL, init?: RequestInit) => { ok: boolean; body?: unknown },
) {
  const mock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const result = handler(url, init);
    return Promise.resolve({ ok: result.ok, json: async () => result.body ?? {} });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderView() {
  return render(
    <ToastProvider>
      <FriendsView initialRequests={[request]} initialOutgoing={[]} initialFriends={[]} />
    </ToastProvider>,
  );
}

describe('FriendsView feedback', () => {
  it('accepts a request with a success toast and an optimistic update', async () => {
    stubFetch(() => ({ ok: true }));
    renderView();

    await userEvent.click(screen.getByRole('tab', { name: /Заявки/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Принять заявку от Иван' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Заявка принята');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Принять заявку от Иван' })).not.toBeInTheDocument();
  });

  it('rolls back the optimistic update and shows an error toast when accepting fails', async () => {
    stubFetch(() => ({ ok: false }));
    renderView();

    await userEvent.click(screen.getByRole('tab', { name: /Заявки/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Принять заявку от Иван' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось принять заявку');
    expect(refreshMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Принять заявку от Иван' })).toBeInTheDocument(),
    );
  });

  it('rolls back the search result when sending a request fails', async () => {
    stubFetch((url) => {
      if (url.pathname === '/api/friendships/search') {
        return {
          ok: true,
          body: { items: [{ id: 9, name: 'Нина', handle: 'nina', relationship: 'none' }] },
        };
      }
      return { ok: false };
    });
    renderView();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Поиск людей' }), 'Нина');
    const addButton = await screen.findByRole('button', { name: 'Добавить Нина' });
    await userEvent.click(addButton);

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось отправить заявку');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Добавить Нина' })).toBeInTheDocument(),
    );
  });

  it('cancels an outgoing request with a success toast', async () => {
    stubFetch(() => ({ ok: true }));
    render(
      <ToastProvider>
        <FriendsView
          initialRequests={[]}
          initialOutgoing={[{ id: 12, user: ivan }]}
          initialFriends={[]}
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('tab', { name: /Заявки/ }));
    const outgoing = screen.getByRole('region', { name: 'Исходящие заявки' });
    await userEvent.click(within(outgoing).getByRole('button', { name: /Отменить заявку для Иван/ }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Заявка отменена');
  });

  it('removes a friend from the list after confirmation', async () => {
    const fetchMock = stubFetch(() => ({ ok: true }));
    render(
      <ToastProvider>
        <FriendsView
          initialRequests={[]}
          initialOutgoing={[]}
          initialFriends={[{ friendshipId: 11, user: ivan }]}
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('tab', { name: /Друзья/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать Иван из друзей' }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Друг удалён');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/friendships/remove',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(screen.getByText('Список друзей пуст')).toBeInTheDocument());
  });

  it('rolls back the friends list and shows an error when removal fails', async () => {
    stubFetch(() => ({ ok: false }));
    render(
      <ToastProvider>
        <FriendsView
          initialRequests={[]}
          initialOutgoing={[]}
          initialFriends={[{ friendshipId: 11, user: ivan }]}
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('tab', { name: /Друзья/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать Иван из друзей' }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось удалить друга');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Убрать Иван из друзей' })).toBeInTheDocument(),
    );
  });
});

describe('social-actions helpers', () => {
  it('resolves true on a successful mutation', async () => {
    stubFetch(() => ({ ok: true }));
    await expect(decideFriendship(7, 'accept')).resolves.toBe(true);
    await expect(sendFriendRequest(2)).resolves.toBe(true);
    await expect(withdrawFriendRequest(7)).resolves.toBe(true);
    await expect(removeFriend(7)).resolves.toBe(true);
  });

  it('resolves false on a failed mutation instead of throwing', async () => {
    stubFetch(() => ({ ok: false }));
    await expect(sendFriendRequest(2)).resolves.toBe(false);
    await expect(removeFriend(7)).resolves.toBe(false);
  });
});
