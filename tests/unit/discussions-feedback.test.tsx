import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GroupDiscussions } from '@/components/features/movie-tracker/GroupDiscussions';
import { ToastProvider } from '@/components/ui/toast';
import type { DiscussionDetail } from '@/modules/discussions';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
  usePathname: () => '/groups/1',
}));

function stubTimeZone(timeZone: string): void {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function stubFetch(ok: boolean) {
  const mock = vi.fn(() => Promise.resolve({ ok, json: async () => ({ id: 1 }) }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderList(isAdmin = true) {
  return render(
    <ToastProvider>
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={isAdmin}
        discussions={[]}
        activeDiscussion={null}
        onOpenDiscussion={() => undefined}
        onCloseDiscussion={() => undefined}
      />
    </ToastProvider>,
  );
}

const activeDiscussion: DiscussionDetail = {
  id: 3,
  groupId: 1,
  authorId: 1,
  authorName: 'Алексей',
  authorHandle: 'me',
  title: 'Тема',
  mediaId: null,
  commentCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  posts: [],
};

describe('GroupDiscussions feedback', () => {
  it('shows a success toast when a discussion is created', async () => {
    stubFetch(true);
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Создать обсуждение' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Название темы'), 'Новая тема');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Обсуждение создано');
  });

  it('keeps the inline error and adds an error toast when creation fails', async () => {
    stubFetch(false);
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Создать обсуждение' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Название темы'), 'Новая тема');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Не удалось создать обсуждение',
    );
    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'error');
  });

  it('keeps the inline validation error without a toast when the title is empty', async () => {
    stubFetch(true);
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Создать обсуждение' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Укажите название темы');
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('shows a success toast when a comment is posted', async () => {
    stubFetch(true);
    render(
      <ToastProvider>
        <GroupDiscussions
          groupId={1}
          isMember
          isAdmin={false}
          discussions={[]}
          activeDiscussion={activeDiscussion}
          onOpenDiscussion={() => undefined}
          onCloseDiscussion={() => undefined}
        />
      </ToastProvider>,
    );

    await userEvent.type(screen.getByLabelText('Комментарий'), 'Первый!');
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveAttribute('data-tone', 'success');
    expect(toast).toHaveTextContent('Комментарий отправлен');
  });

  it('shows a comment moment in the browser timezone and format', async () => {
    stubTimeZone('UTC');
    const discussion: DiscussionDetail = {
      ...activeDiscussion,
      posts: [
        {
          id: 1,
          discussionId: 3,
          authorId: 2,
          authorName: 'Мария',
          authorHandle: 'maria',
          body: 'Первый!',
          createdAt: '2024-01-05T14:07:00.000Z',
        },
      ],
    };
    render(
      <ToastProvider>
        <GroupDiscussions
          groupId={1}
          isMember
          isAdmin={false}
          discussions={[]}
          activeDiscussion={discussion}
          onOpenDiscussion={() => undefined}
          onCloseDiscussion={() => undefined}
        />
      </ToastProvider>,
    );

    const list = screen.getByTestId('discussion-posts');
    expect(await within(list).findByText('14:07 05.01.24')).toBeInTheDocument();
  });
});
