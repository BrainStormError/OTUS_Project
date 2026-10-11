import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupActivity } from '@/components/features/movie-tracker/GroupActivity';
import { GroupDiscussions } from '@/components/features/movie-tracker/GroupDiscussions';
import { GroupRatings } from '@/components/features/movie-tracker/GroupRatings';
import { GroupTabPanel } from '@/components/features/movie-tracker/GroupTabPanels';
import { GroupTabSkeleton } from '@/components/features/movie-tracker/GroupTabSkeleton';
import { GroupTabs } from '@/components/features/movie-tracker/GroupTabs';
import type { FeedItem } from '@/modules/activity';
import type { DiscussionSummary, DiscussionDetail } from '@/modules/discussions';
import type { GroupRatingSummary } from '@/modules/groups';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const discussion: DiscussionSummary = {
  id: 1,
  groupId: 1,
  authorId: 1,
  authorName: 'Админ',
  authorHandle: 'admin',
  title: 'Обсуждаем Начало',
  mediaId: null,
  commentCount: 2,
  createdAt: '2026-10-01T00:00:00.000Z',
};

function feedItem(overrides: Partial<FeedItem>): FeedItem {
  return {
    id: 1,
    actorId: 1,
    kind: 'film_rated',
    groupId: 1,
    mediaId: 27205,
    discussionId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    actorName: 'Мария',
    actorHandle: 'maria',
    groupName: 'Киновечера',
    title: 'Начало',
    rating: 8.5,
    href: null,
    ...overrides,
  };
}

describe('GroupTabs', () => {
  it('renders the full tab set with the active tab selected', () => {
    render(<GroupTabs groupId={1} active="ratings" />);
    for (const label of ['Обсуждения', 'Оценки', 'Активность', 'Участники', 'Статистика']) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('tab', { name: 'Оценки' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Обсуждения' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('provides a visible focus indicator on the tab controls', () => {
    render(<GroupTabs groupId={1} active="discussions" />);
    expect(screen.getByRole('tab', { name: 'Обсуждения' }).className).toContain(
      'focus-visible:ring-2',
    );
  });
});

describe('GroupDiscussions', () => {
  it('lists topics with author and comment count', () => {
    render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[discussion]}
        activeDiscussion={null}
      />,
    );
    const list = screen.getByTestId('group-discussions');
    expect(within(list).getByText('Обсуждаем Начало')).toBeInTheDocument();
    expect(within(list).getByText('Админ')).toBeInTheDocument();
    expect(within(list).getByText(/Комментариев: 2/)).toBeInTheDocument();
  });

  it('shows the create form only to admins', () => {
    const { rerender } = render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[]}
        activeDiscussion={null}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Создать обсуждение' })).not.toBeInTheDocument();

    rerender(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin
        discussions={[]}
        activeDiscussion={null}
      />,
    );
    expect(screen.getByRole('button', { name: 'Создать обсуждение' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no discussions', () => {
    render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[]}
        activeDiscussion={null}
      />,
    );
    expect(screen.getByText('Пока нет обсуждений')).toBeInTheDocument();
  });

  it('renders an open discussion with its comments and posts a new comment', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 2 }) });
    vi.stubGlobal('fetch', fetchMock);
    const detail: DiscussionDetail = {
      ...discussion,
      posts: [
        {
          id: 1,
          discussionId: 1,
          authorId: 2,
          authorName: 'Иван',
          authorHandle: 'ivan',
          body: 'Первый комментарий',
          createdAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    };
    render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[discussion]}
        activeDiscussion={detail}
      />,
    );
    expect(screen.getByText('Первый комментарий')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Комментарий'), 'Мой ответ');
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/discussions/1/posts',
      expect.objectContaining({ method: 'POST' }),
    );
    vi.unstubAllGlobals();
  });
});

describe('GroupRatings', () => {
  const rating: GroupRatingSummary = {
    mediaId: 27205,
    mediaKind: 'film',
    mediaRef: '27205',
    title: 'Начало',
    year: 2010,
    average: 8.5,
    discussionId: null,
    ratings: [
      {
        mediaId: 27205,
        userId: 1,
        name: 'Мария',
        handle: 'maria',
        rating: 8,
        comment: null,
        watchedAt: '2026-08-12',
        createdAt: '2026-08-12T00:00:00.000Z',
      },
      {
        mediaId: 27205,
        userId: 2,
        name: 'Иван',
        handle: 'ivan',
        rating: 9,
        comment: null,
        watchedAt: '2026-08-13',
        createdAt: '2026-08-13T00:00:00.000Z',
      },
    ],
  };

  it('shows the group average and reveals individual ratings', async () => {
    render(<GroupRatings groupId={1} isMember isAdmin={false} ratings={[rating]} />);
    const table = screen.getByTestId('group-ratings');
    expect(within(table).getByText('8.5')).toBeInTheDocument();
    await userEvent.click(within(table).getByRole('button', { name: 'Начало' }));
    expect(within(table).getByText(/Мария/)).toBeInTheDocument();
    expect(within(table).getByText(/Иван/)).toBeInTheDocument();
  });

  it('shows the empty state when there are no ratings', () => {
    render(<GroupRatings groupId={1} isMember isAdmin={false} ratings={[]} />);
    expect(screen.getByText('В группе пока нет оценок')).toBeInTheDocument();
  });

  it('wraps the ratings table in a horizontally scrollable container', () => {
    render(<GroupRatings groupId={1} isMember isAdmin={false} ratings={[rating]} />);
    const table = screen.getByTestId('group-ratings');
    expect(table.parentElement?.className).toContain('overflow-x-auto');
  });

  it('submits a rating for a member through the media picker', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            kind: 'film',
            externalId: '27205',
            title: 'Начало',
            year: 2010,
            posterUrl: null,
            externalRating: 8.4,
            genres: ['Боевик'],
            genreIds: [28],
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<GroupRatings groupId={1} isMember isAdmin={false} ratings={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Добавить оценку' }));
    const picker = screen.getByRole('dialog');
    expect(within(picker).queryByRole('button', { name: /^Начало/ })).not.toBeInTheDocument();
    await userEvent.type(within(picker).getByLabelText('Название'), 'Начало');
    await userEvent.click(within(picker).getByRole('button', { name: 'Найти' }));
    await userEvent.click(within(picker).getByRole('button', { name: /^Начало/ }));

    const form = await screen.findByRole('dialog');
    await userEvent.type(within(form).getByLabelText(/^Оценка \(/), '8');
    await userEvent.click(within(form).getByRole('button', { name: 'Сохранить' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/1/ratings',
      expect.objectContaining({ method: 'POST' }),
    );
    vi.unstubAllGlobals();
  });

  it('offers an attach control to admins for a rated media', () => {
    render(<GroupRatings groupId={1} isMember isAdmin ratings={[rating]} />);
    expect(screen.getByRole('button', { name: 'Обсудить' })).toBeInTheDocument();
  });
});

describe('GroupActivity', () => {
  it('offers a link to the discussion only for rating events with an attached discussion', () => {
    render(
      <GroupActivity
        groupId={1}
        visible
        events={[
          feedItem({ id: 1, discussionId: 1 }),
          feedItem({ id: 2, mediaId: 603, discussionId: null }),
        ]}
      />,
    );
    const list = screen.getByTestId('group-activity');
    expect(within(list).getAllByRole('link', { name: 'К обсуждению' })).toHaveLength(1);
    expect(within(list).getByRole('link', { name: 'К обсуждению' })).toHaveAttribute(
      'href',
      '/groups/1?tab=discussions&discussion=1',
    );
  });

  it('shows the empty state and the restricted state', () => {
    const { rerender } = render(<GroupActivity groupId={1} events={[]} visible />);
    expect(screen.getByText('Пока нет активности')).toBeInTheDocument();

    rerender(<GroupActivity groupId={1} events={[]} visible={false} />);
    expect(screen.getByTestId('restricted-no-permission')).toBeInTheDocument();
  });
});

describe('GroupTabSkeleton', () => {
  it('renders a list shape for content tabs', () => {
    render(<GroupTabSkeleton tab="discussions" />);
    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-stats')).not.toBeInTheDocument();
  });

  it('renders a list shape for the members tab', () => {
    render(<GroupTabSkeleton tab="members" />);
    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
  });

  it('renders a stats shape for the statistics tab', () => {
    render(<GroupTabSkeleton tab="stats" />);
    expect(screen.getByTestId('skeleton-stats')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-list')).not.toBeInTheDocument();
  });

  it('exposes a loading status labelled with the selected tab', () => {
    render(<GroupTabSkeleton tab="ratings" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('data-tab', 'ratings');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });
});

function PendingPanel(): never {
  throw new Promise<void>(() => undefined);
}

describe('GroupTabPanel', () => {
  it("shows the active tab's skeleton until its content arrives", () => {
    render(
      <GroupTabPanel tab="activity">
        <PendingPanel />
      </GroupTabPanel>,
    );

    const skeleton = screen.getByTestId('group-tab-skeleton');
    expect(skeleton).toHaveAttribute('data-tab', 'activity');
    expect(screen.queryByText('Пока нет активности')).not.toBeInTheDocument();
  });
});
