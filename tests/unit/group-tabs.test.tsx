import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupActivity } from '@/components/features/movie-tracker/GroupActivity';
import { GroupDiscussions } from '@/components/features/movie-tracker/GroupDiscussions';
import { GroupRatings } from '@/components/features/movie-tracker/GroupRatings';
import { GroupTabs } from '@/components/features/movie-tracker/GroupTabs';
import type { FeedItem } from '@/modules/activity';
import type { DiscussionSummary, DiscussionDetail } from '@/modules/discussions';
import type { GroupRatingSummary } from '@/modules/groups';

import type { Group } from '@/components/features/movie-tracker/types';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

type RatingsResponse = { ok: boolean; status?: number; body?: unknown };

function isRatingsCall(input: unknown): boolean {
  const url = String(input);
  return url.includes('/api/groups/') && url.includes('/ratings');
}

function stubRatingsFetch(responses: RatingsResponse[]) {
  let index = 0;
  const mock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/genres')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ items: [] }) });
    }
    const next = responses[Math.min(index, responses.length - 1)] ?? { ok: true };
    index += 1;
    return Promise.resolve({
      ok: next.ok,
      status: next.status,
      json: async () => next.body ?? {},
    });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function stubGenresFetch() {
  const mock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items: [] }),
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function ratingsCalls(mock: ReturnType<typeof vi.fn>): RequestInit[] {
  return mock.mock.calls
    .filter(([input]) => isRatingsCall(input))
    .map(([, init]) => (init ?? {}) as RequestInit);
}

function ratingsCallCount(mock: ReturnType<typeof vi.fn>): number {
  return ratingsCalls(mock).length;
}

function ratingsCall(mock: ReturnType<typeof vi.fn>): RequestInit | undefined {
  return ratingsCalls(mock)[0];
}

function ratingsBodies(mock: ReturnType<typeof vi.fn>): string[] {
  return ratingsCalls(mock).map((init) => String(init.body));
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

const discussionDetail: DiscussionDetail = {
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

const parasites: DiscussionDetail = {
  ...discussion,
  id: 7,
  title: 'Обсуждаем Паразиты',
  posts: [],
};

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

const group: Group = {
  id: 1,
  name: 'Киновечера',
  tags: [],
  members: [{ id: 1, name: 'Админ', handle: 'admin', role: 'admin' }],
  stats: {
    films: 2,
    series: 1,
    genres: [{ genre: 'драма', count: 2 }],
    years: [{ year: 2010, count: 2 }],
  },
};

function renderTabs(overrides: Partial<Parameters<typeof GroupTabs>[0]> = {}) {
  return render(
    <GroupTabs
      groupId={1}
      group={group}
      isMember
      isAdmin={false}
      currentUserId={1}
      discussions={[discussionDetail]}
      ratings={[]}
      activityEvents={[]}
      activityVisible
      initialDiscussionId={null}
      {...overrides}
    />,
  );
}

describe('GroupTabs controller', () => {
  it('switches the visible panel on a tab click without navigation', async () => {
    stubGenresFetch();
    const replace = vi.spyOn(window.history, 'replaceState');
    renderTabs();

    expect(screen.getByText('Обсуждаем Начало')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Оценки' }));

    expect(screen.getByRole('tab', { name: 'Оценки' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('В группе пока нет оценок')).toBeInTheDocument();
    expect(screen.queryByTestId('group-tab-skeleton')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(null, '', '/groups/1?tab=ratings');
  });

  it('falls back to the discussions tab for an unknown initial tab', () => {
    renderTabs({ initialTab: 'nope' });
    expect(screen.getByRole('tab', { name: 'Обсуждения' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Обсуждаем Начало')).toBeInTheDocument();
  });

  it('opens a deep-linked discussion with its comments', () => {
    renderTabs({ initialTab: 'discussions', initialDiscussionId: 1 });
    expect(screen.getByTestId('discussion-detail')).toBeInTheDocument();
    expect(screen.getByText('Первый комментарий')).toBeInTheDocument();
  });

  it('does not create history entries when switching tabs', async () => {
    renderTabs();
    const replace = vi.spyOn(window.history, 'replaceState');
    const push = vi.spyOn(window.history, 'pushState');

    await userEvent.click(screen.getByRole('tab', { name: 'Участники' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Статистика' }));

    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalled();
  });

  it('renders the group statistics from the Оценки tab data', async () => {
    renderTabs({ ratings: [rating] });

    await userEvent.click(screen.getByRole('tab', { name: 'Статистика' }));

    const statistics = screen.getByTestId('statistics');
    const cards = within(statistics).getAllByTestId('stat-card');
    expect(cards).toHaveLength(4);
    expect(within(cards[0]!).getByText('2')).toBeInTheDocument();
    expect(within(cards[1]!).getByText('1')).toBeInTheDocument();
  });

  it('opens a discussion from a cross-tab link in place', async () => {
    stubGenresFetch();
    const replace = vi.spyOn(window.history, 'replaceState');
    renderTabs({
      initialTab: 'ratings',
      ratings: [{ ...rating, discussionId: 7 }],
      discussions: [parasites],
    });

    await userEvent.click(screen.getByRole('button', { name: 'К обсуждению' }));

    expect(screen.getByRole('tab', { name: 'Обсуждения' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('discussion-detail')).toBeInTheDocument();
    expect(screen.getByText('Обсуждаем Паразиты')).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(null, '', '/groups/1?tab=discussions&discussion=7');
  });

  it('returns to the discussion list through the local controller', async () => {
    const replace = vi.spyOn(window.history, 'replaceState');
    renderTabs({ initialTab: 'discussions', initialDiscussionId: 1 });

    await userEvent.click(screen.getByRole('button', { name: '← К обсуждениям' }));

    expect(screen.getByTestId('group-discussions')).toBeInTheDocument();
    expect(screen.queryByTestId('discussion-detail')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(null, '', '/groups/1?tab=discussions');
  });

  it('keeps the tab controls visually focusable', () => {
    renderTabs();
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
        onOpenDiscussion={vi.fn()}
        onCloseDiscussion={vi.fn()}
      />,
    );
    const list = screen.getByTestId('group-discussions');
    expect(within(list).getByText('Обсуждаем Начало')).toBeInTheDocument();
    expect(within(list).getByText('Админ')).toBeInTheDocument();
    expect(within(list).getByText(/Комментариев: 2/)).toBeInTheDocument();
  });

  it('opens a topic through the local controller instead of navigating', async () => {
    const onOpenDiscussion = vi.fn();
    render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[discussion]}
        activeDiscussion={null}
        onOpenDiscussion={onOpenDiscussion}
        onCloseDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Обсуждаем Начало/ }));

    expect(onOpenDiscussion).toHaveBeenCalledWith(1);
  });

  it('shows the create form only to admins', () => {
    const { rerender } = render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[]}
        activeDiscussion={null}
        onOpenDiscussion={vi.fn()}
        onCloseDiscussion={vi.fn()}
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
        onOpenDiscussion={vi.fn()}
        onCloseDiscussion={vi.fn()}
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
        onOpenDiscussion={vi.fn()}
        onCloseDiscussion={vi.fn()}
      />,
    );
    expect(screen.getByText('Пока нет обсуждений')).toBeInTheDocument();
  });

  it('renders an open discussion with its comments and posts a new comment', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 2 }) });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <GroupDiscussions
        groupId={1}
        isMember
        isAdmin={false}
        discussions={[discussion]}
        activeDiscussion={discussionDetail}
        onOpenDiscussion={vi.fn()}
        onCloseDiscussion={vi.fn()}
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
  it('shows the group average and reveals individual ratings', async () => {
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );
    const table = screen.getByTestId('group-ratings');
    expect(within(table).getByText('8.5')).toBeInTheDocument();
    await userEvent.click(within(table).getByRole('button', { name: 'Начало' }));
    expect(within(table).getByText(/Мария/)).toBeInTheDocument();
    expect(within(table).getByText(/Иван/)).toBeInTheDocument();
  });

  it('shows the empty state when there are no ratings', () => {
    render(
      <GroupRatings groupId={1} isMember isAdmin={false} ratings={[]} onOpenDiscussion={vi.fn()} />,
    );
    expect(screen.getByText('В группе пока нет оценок')).toBeInTheDocument();
  });

  it('wraps the ratings table in a horizontally scrollable container', () => {
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );
    const table = screen.getByTestId('group-ratings');
    expect(table.parentElement?.className).toContain('overflow-x-auto');
  });

  it('submits a rating for an administrator through the media picker', async () => {
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
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin
        currentUserId={1}
        ratings={[]}
        onOpenDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Добавить оценку' }));
    const picker = screen.getByRole('dialog');
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

  it('scopes the picker genre options to the selected kind without a genres request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin
        ratings={[]}
        genresByKind={{
          film: [{ value: '28', label: 'Боевик' }],
          series: [{ value: '10765', label: 'Научная фантастика' }],
        }}
        onOpenDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Добавить оценку' }));
    const picker = screen.getByRole('dialog');
    await userEvent.click(within(picker).getByText('Жанр'));
    let group = screen.getByRole('group', { name: 'Жанр' });
    expect(within(group).getByRole('checkbox', { name: 'Боевик' })).toBeInTheDocument();
    expect(
      within(group).queryByRole('checkbox', { name: 'Научная фантастика' }),
    ).not.toBeInTheDocument();

    await userEvent.click(within(picker).getByRole('button', { name: 'Сериалы' }));
    await userEvent.click(within(picker).getByText('Жанр'));
    group = screen.getByRole('group', { name: 'Жанр' });
    expect(
      within(group).getByRole('checkbox', { name: 'Научная фантастика' }),
    ).toBeInTheDocument();
    expect(within(group).queryByRole('checkbox', { name: 'Боевик' })).not.toBeInTheDocument();

    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes('/api/genres')),
    ).toBe(false);
  });

  it('does not offer the start control to a member', () => {
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={2}
        ratings={[]}
        onOpenDiscussion={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Добавить оценку' })).not.toBeInTheDocument();
  });

  it('offers Оценить without an own rating and Изменить once the member has one', () => {
    const { rerender } = render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={999}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Оценить' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Изменить' })).not.toBeInTheDocument();

    rerender(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={1}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Изменить' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Оценить' })).not.toBeInTheDocument();
  });

  it('opens an attached discussion through the local controller', async () => {
    const onOpenDiscussion = vi.fn();
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={1}
        ratings={[{ ...rating, discussionId: 7 }]}
        onOpenDiscussion={onOpenDiscussion}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'К обсуждению' }));

    expect(onOpenDiscussion).toHaveBeenCalledWith(7);
    expect(screen.getByRole('button', { name: 'Изменить' })).toBeInTheDocument();
  });

  it('saves a rating from the row action and reloads the group read', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ userId: 1 }) });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={999}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Оценить' }));
    const form = await screen.findByRole('dialog');
    await userEvent.type(within(form).getByLabelText(/^Оценка \(/), '7.5');
    await userEvent.click(within(form).getByRole('button', { name: 'Сохранить' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/groups/1/ratings',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/groups/1',
        expect.objectContaining({ cache: 'reload' }),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('offers an attach control to admins for a rated media', () => {
    render(
      <GroupRatings groupId={1} isMember isAdmin ratings={[rating]} onOpenDiscussion={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Обсудить' })).toBeInTheDocument();
  });

  it('offers the add-to-personal checkbox and sends it when set', async () => {
    const fetchMock = stubRatingsFetch([{ ok: true, body: { userId: 1 } }]);
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={999}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Оценить' }));
    const form = await screen.findByRole('dialog');
    const checkbox = within(form).getByRole('checkbox', {
      name: 'также добавить в мои фильмы',
    });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    await userEvent.type(within(form).getByLabelText(/^Оценка \(/), '7.5');
    await userEvent.click(within(form).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(ratingsCall(fetchMock)).toBeDefined());
    expect(JSON.parse(String(ratingsCall(fetchMock)?.body))).toMatchObject({
      alsoPersonal: true,
      mediaRef: '27205',
    });
    vi.unstubAllGlobals();
  });

  it('asks to confirm before overwriting an existing personal rating', async () => {
    const fetchMock = stubRatingsFetch([
      { ok: false, status: 409, body: { error: 'conflict' } },
      { ok: true, body: { userId: 1 } },
    ]);
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={999}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Оценить' }));
    const form = await screen.findByRole('dialog');
    await userEvent.click(within(form).getByRole('checkbox'));
    await userEvent.type(within(form).getByLabelText(/^Оценка \(/), '7.5');
    await userEvent.click(within(form).getByRole('button', { name: 'Сохранить' }));

    const confirmDialog = await screen.findByRole('dialog', {
      name: 'Перезаписать личную оценку?',
    });
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Перезаписать' }));

    await waitFor(() => expect(ratingsCallCount(fetchMock)).toBe(2));
    const bodies = ratingsBodies(fetchMock);
    expect(JSON.parse(String(bodies[1]))).toMatchObject({
      alsoPersonal: true,
      confirmOverwrite: true,
    });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/groups/1',
        expect.objectContaining({ cache: 'reload' }),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('clears the checkbox and saves nothing when the overwrite is dismissed', async () => {
    const fetchMock = stubRatingsFetch([
      { ok: false, status: 409, body: { error: 'conflict' } },
    ]);
    render(
      <GroupRatings
        groupId={1}
        isMember
        isAdmin={false}
        currentUserId={999}
        ratings={[rating]}
        onOpenDiscussion={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Оценить' }));
    const form = await screen.findByRole('dialog');
    await userEvent.click(within(form).getByRole('checkbox'));
    await userEvent.type(within(form).getByLabelText(/^Оценка \(/), '7.5');
    await userEvent.click(within(form).getByRole('button', { name: 'Сохранить' }));

    const confirmDialog = await screen.findByRole('dialog', {
      name: 'Перезаписать личную оценку?',
    });
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Отмена' }));

    await waitFor(() =>
      expect(
        within(form).getByRole('checkbox', { name: 'также добавить в мои фильмы' }),
      ).not.toBeChecked(),
    );
    expect(ratingsCallCount(fetchMock)).toBe(1);
    vi.unstubAllGlobals();
  });
});

describe('GroupActivity', () => {
  it('offers the discussion control only for rating events with an attached discussion', async () => {
    const onOpenDiscussion = vi.fn();
    render(
      <GroupActivity
        visible
        events={[
          feedItem({ id: 1, discussionId: 1 }),
          feedItem({ id: 2, mediaId: 603, discussionId: null }),
        ]}
        onOpenDiscussion={onOpenDiscussion}
      />,
    );
    const list = screen.getByTestId('group-activity');
    const controls = within(list).getAllByRole('button', { name: 'К обсуждению' });
    expect(controls).toHaveLength(1);

    await userEvent.click(controls[0]!);
    expect(onOpenDiscussion).toHaveBeenCalledWith(1);
  });

  it('shows the empty state and the restricted state', () => {
    const { rerender } = render(
      <GroupActivity events={[]} visible onOpenDiscussion={vi.fn()} />,
    );
    expect(screen.getByText('Пока нет активности')).toBeInTheDocument();

    rerender(<GroupActivity events={[]} visible={false} onOpenDiscussion={vi.fn()} />);
    expect(screen.getByTestId('restricted-no-permission')).toBeInTheDocument();
  });

  it('shows an event moment in the browser timezone and format', async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Europe/Moscow',
    } as Intl.ResolvedDateTimeFormatOptions);
    render(
      <GroupActivity
        visible
        events={[feedItem({ id: 1, createdAt: '2024-01-05T14:07:00.000Z' })]}
        onOpenDiscussion={vi.fn()}
      />,
    );
    const list = screen.getByTestId('group-activity');
    expect(await within(list).findByText('17:07 05.01.24')).toBeInTheDocument();
  });
});
