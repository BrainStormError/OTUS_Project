import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsView } from '@/components/features/movie-tracker/SettingsView';
import { ToastProvider } from '@/components/ui/toast';

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function stubFetch(ok: boolean, body: unknown = { profileHidden: true, statsHidden: false }) {
  const mock = vi.fn(() => Promise.resolve({ ok, json: async () => body }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderSettings() {
  return render(
    <ToastProvider>
      <SettingsView initialProfileHidden={false} initialStatsHidden={false} name="Алексей" handle="me" />
    </ToastProvider>,
  );
}

describe('SettingsView privacy feedback', () => {
  it('shows a success toast and keeps the inline save status', async () => {
    stubFetch(true);
    renderSettings();

    await userEvent.click(screen.getByRole('switch', { name: 'Скрыть профиль' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Настройки приватности сохранены');
    expect(screen.getByText('Сохранено')).toBeInTheDocument();
  });

  it('shows an error toast and keeps the inline error status on failure', async () => {
    stubFetch(false);
    renderSettings();

    await userEvent.click(screen.getByRole('switch', { name: 'Скрыть профиль' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось сохранить настройки');
    expect(screen.getByText('Не сохранено')).toBeInTheDocument();
  });
});
