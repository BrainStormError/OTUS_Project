import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import { AppShell } from '@/components/layout/app-shell';
import { IDENTITY_DISPLAY_KEY } from '@/components/layout/preferences';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  replaceMock.mockReset();
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AppShell identity', () => {
  it('renders no identity before the read answers', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByText('Алексей')).not.toBeInTheDocument();
    expect(screen.queryByText('@me')).not.toBeInTheDocument();
    expect(screen.getByText('Аккаунт')).toBeInTheDocument();
  });

  it('fills the shell with the name and handle after the read answers', async () => {
    window.localStorage.setItem(IDENTITY_DISPLAY_KEY, 'both');
    vi.stubGlobal('fetch', vi.fn(async () => json({ id: 7, name: 'Алексей', handle: 'me' })));
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(await screen.findByText('Алексей')).toBeInTheDocument();
    expect(screen.getByText('@me')).toBeInTheDocument();
  });

  it.each([401, 403])('sends a %i answer to the login screen', async (status) => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Требуется вход' }, status)));
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
  });

  it('stays in place on a successful answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ id: 1, name: 'Алексей', handle: 'me' })));
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    await screen.findByText('Алексей');
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
