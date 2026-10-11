import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FriendActionButton } from '@/components/features/movie-tracker/FriendActionButton';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderButton(props: React.ComponentProps<typeof FriendActionButton>) {
  return render(
    <ToastProvider>
      <FriendActionButton {...props} />
    </ToastProvider>,
  );
}

describe('FriendActionButton', () => {
  it('offers the add action when there is no relationship and marks the request as sent', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({ ok: true, json: async () => ({}) }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderButton({ userId: 5, relationship: 'none', name: 'Иван' });

    const add = screen.getByRole('button', { name: 'Добавить Иван' });
    await userEvent.click(add);

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveTextContent('Заявка отправлена');
    expect(screen.getAllByText('Заявка отправлена').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Добавить Иван' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/friendships',
      expect.objectContaining({ method: 'POST' }),
    );
    const call = fetchMock.mock.calls[0];
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ addresseeId: 5 });
  });

  it('shows a non-interactive marker for an outgoing request', () => {
    renderButton({ userId: 5, relationship: 'pending_out' });
    expect(screen.getByText('Заявка отправлена')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a non-interactive marker for an incoming request', () => {
    renderButton({ userId: 5, relationship: 'pending_in' });
    expect(screen.getByText('Ожидает ответа')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('asks for confirmation before removing a friend and calls the handler on confirm', async () => {
    const onRemove = vi.fn();
    renderButton({ userId: 5, relationship: 'friend', friendshipId: 9, onRemove });

    await userEvent.click(screen.getByRole('button', { name: 'Убрать из друзей' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Убрать' }));

    expect(onRemove).toHaveBeenCalledWith(9);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the friend when the confirmation is cancelled', async () => {
    const onRemove = vi.fn();
    renderButton({ userId: 5, relationship: 'friend', friendshipId: 9, onRemove });

    await userEvent.click(screen.getByRole('button', { name: 'Убрать из друзей' }));
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать из друзей' })).toBeInTheDocument();
  });

  it('removes the friend itself when no handler is provided', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({ ok: true, json: async () => ({}) }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderButton({ userId: 5, relationship: 'friend', friendshipId: 9 });

    await userEvent.click(screen.getByRole('button', { name: 'Убрать из друзей' }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать' }));

    expect(await screen.findByText('Друг удалён')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/friendships/remove',
      expect.objectContaining({ method: 'POST' }),
    );
    const call = fetchMock.mock.calls[0];
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ friendshipId: 9 });
  });
});
