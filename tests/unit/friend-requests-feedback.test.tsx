import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FriendRequestsView } from '@/components/features/movie-tracker/FriendRequestsView';
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

function stubFetch(ok: boolean) {
  const mock = vi.fn(() => Promise.resolve({ ok, json: async () => ({}) }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderView() {
  return render(
    <ToastProvider>
      <FriendRequestsView incoming={[request]} outgoing={[]} />
    </ToastProvider>,
  );
}

describe('FriendRequestsView feedback', () => {
  it('accepts a request with a success toast, a refetch, and an optimistic removal', async () => {
    stubFetch(true);
    renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Принять заявку от Иван' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Заявка принята');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Принять заявку от Иван' })).not.toBeInTheDocument();
  });

  it('restores the request with an error toast and no refetch when accepting fails', async () => {
    stubFetch(false);
    renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Принять заявку от Иван' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось принять заявку');
    expect(refreshMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Принять заявку от Иван' })).toBeInTheDocument(),
    );
  });

  it('declines a request with a success toast and a refetch', async () => {
    stubFetch(true);
    renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Отклонить заявку от Иван' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Заявка отклонена');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
