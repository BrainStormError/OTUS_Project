import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarRail } from '@/components/layout/sidebar-rail';
import { AsyncView } from '@/components/features/AsyncView';
import { SearchField } from '@/components/features/movie-tracker/SearchField';
import { listMovies } from '@/components/features/movie-tracker/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

vi.mock('next/navigation', () => ({
  usePathname: () => '/films',
}));

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Открыть
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Форма">
        <button type="button">Внутри</button>
      </Modal>
    </>
  );
}

describe('modal keyboard operation', () => {
  it('traps focus, closes on Escape, and returns focus to the trigger', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Открыть' });
    await userEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const close = screen.getByRole('button', { name: 'Закрыть' });
    expect(document.activeElement).toBe(close);

    const inside = screen.getByRole('button', { name: 'Внутри' });
    inside.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(inside);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('accessible names and focus', () => {
  it('gives the collapsed rail toggle and every icon-only item an accessible name', async () => {
    render(<SidebarRail />);
    const toggle = screen.getByRole('button', { name: 'Свернуть меню' });
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Развернуть меню' })).toBeInTheDocument();
    for (const label of ['Главная', 'Мои фильмы', 'Мои сериалы', 'Друзья', 'Группы', 'Профиль', 'Настройки']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('gives buttons and inputs a visible focus indicator', () => {
    render(
      <div>
        <Button>Действие</Button>
        <Button size="icon" aria-label="Иконка">
          x
        </Button>
        <Input aria-label="Поле" />
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Действие' }).className).toContain('focus-visible:ring-2');
    expect(screen.getByRole('button', { name: 'Иконка' }).className).toContain('focus-visible:ring-2');
    expect(screen.getByRole('textbox', { name: 'Поле' }).className).toContain('focus-visible:ring-2');
  });

  it('sizes interactive targets to at least 44px', () => {
    render(
      <div>
        <Button>Действие</Button>
        <Button size="icon" aria-label="Иконка">
          x
        </Button>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Действие' }).className).toMatch(/min-h-11|h-11/);
    expect(screen.getByRole('button', { name: 'Иконка' }).className).toMatch(/h-11 w-11/);
    expect(screen.getByRole('button', { name: 'Иконка' }).className).not.toMatch(/h-10 w-10/);
  });

  it('announces asynchronous loading and error changes', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<AsyncView state={{ status: 'loading' }}>{() => null}</AsyncView>);
    expect(screen.getByTestId('async-loading')).toHaveAttribute('aria-live', 'polite');

    rerender(
      <AsyncView state={{ status: 'error', message: 'Сбой', retry: onRetry }}>{() => null}</AsyncView>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Сбой');
  });

  it('keeps a logical keyboard order through search', async () => {
    render(
      <SearchField
        movies={listMovies()}
        filters={{}}
        onFiltersChange={() => undefined}
        onSearch={() => undefined}
      />,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Найти' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText('Название')).toHaveFocus();
    expect(screen.getByText('Поиск')).toBeInTheDocument();
  });
});
