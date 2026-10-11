import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from '@/components/ui/toast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.success('Запись сохранена')}>
        Успех
      </button>
      <button type="button" onClick={() => toast.error('Не удалось сохранить запись')}>
        Ошибка
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider and useToast', () => {
  it('shows a success toast with a success tone', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Успех' }));

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Запись сохранена');
    expect(within(toast).getByText('Успех:')).toBeInTheDocument();
  });

  it('shows an error toast with a failure tone distinguishable without color', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Ошибка' }));

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
    expect(toast).toHaveTextContent('Не удалось сохранить запись');
    expect(within(toast).getByText('Ошибка:')).toBeInTheDocument();
  });

  it('stacks concurrent toasts in the viewport', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Успех' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ошибка' }));

    expect(screen.getAllByTestId('toast')).toHaveLength(2);
  });

  it('dismisses a toast through its close control', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Успех' }));

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть уведомление' }));
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('auto-dismisses a toast after its delay', () => {
    vi.useFakeTimers();
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Успех' }));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });
});
