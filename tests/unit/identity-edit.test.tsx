import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refresh, push, pathname } = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  pathname: { current: '/me' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push }),
  usePathname: () => pathname.current,
}));

import { EditIdentityModal } from '@/components/features/movie-tracker/EditIdentityModal';

beforeEach(() => {
  vi.clearAllMocks();
  pathname.current = '/me';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EditIdentityModal', () => {
  it('renders nothing while closed', () => {
    render(
      <EditIdentityModal open={false} field="name" currentValue="Старое" onClose={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits a new display name and closes the modal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Новое', handle: 'old-tag' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const onClose = vi.fn();

    render(
      <EditIdentityModal open field="name" currentValue="Старое" onClose={onClose} />,
    );

    const input = screen.getByLabelText('Отображаемое имя');
    expect(input).toHaveValue('Старое');
    await userEvent.clear(input);
    await userEvent.type(input, 'Новое');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/me/identity',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Новое' }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('shows the server error and stays open on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Этот тэг уже занят' }),
      }),
    );
    const onClose = vi.fn();

    render(
      <EditIdentityModal open field="handle" currentValue="old-tag" onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Этот тэг уже занят');
    expect(onClose).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('navigates to the own profile after a tag change at /u/<handle>', async () => {
    pathname.current = '/u/old-tag';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Ника', handle: 'new-tag' }),
      }),
    );

    render(
      <EditIdentityModal open field="handle" currentValue="old-tag" onClose={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(push).toHaveBeenCalledWith('/me');
    expect(refresh).not.toHaveBeenCalled();
  });
});
