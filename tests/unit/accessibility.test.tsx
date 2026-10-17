import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarRail } from '@/components/layout/sidebar-rail';
import { SearchField } from '@/components/features/movie-tracker/SearchField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const genres = [
  { value: 'драма', label: 'Драма' },
  { value: 'боевик', label: 'Боевик' },
];

vi.mock('next/navigation', () => ({
  usePathname: () => '/films',
  useRouter: () => ({ prefetch: vi.fn() }),
}));

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

function Harness() {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Открыть
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Форма">
        <input
          aria-label="Комментарий"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
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
    const field = screen.getByLabelText('Комментарий');
    expect(document.activeElement).toBe(field);

    const close = screen.getByRole('button', { name: 'Закрыть' });
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

  it('keeps focus on the field while typing', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));

    const field = screen.getByLabelText('Комментарий');
    await userEvent.type(field, 'текст');

    expect(field).toHaveValue('текст');
    expect(document.activeElement).toBe(field);
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Закрыть' }));
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

  it('keeps a logical keyboard order through search', async () => {
    render(
      <SearchField
        filters={{}}
        onFiltersChange={() => undefined}
        onSearch={() => undefined}
        genres={genres}
      />,
    );
    await userEvent.tab();
    expect(screen.getByLabelText('Название')).toHaveFocus();

    let reachedSubmit = false;
    for (let step = 0; step < 12; step += 1) {
      await userEvent.tab();
      if (document.activeElement === screen.getByRole('button', { name: 'Найти' })) {
        reachedSubmit = true;
        break;
      }
    }
    expect(reachedSubmit).toBe(true);
    expect(screen.getByText('Поиск')).toBeInTheDocument();
  });
});
