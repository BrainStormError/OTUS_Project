import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshMock, pushMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => '/groups/3',
}));

import { AdminMemberPanel } from '@/components/features/movie-tracker/AdminMemberPanel';
import { DissolveGroupButton } from '@/components/features/movie-tracker/DissolveGroupButton';
import { EditIdentityModal } from '@/components/features/movie-tracker/EditIdentityModal';
import { GroupDiscussions } from '@/components/features/movie-tracker/GroupDiscussions';
import { GroupSettingsForm } from '@/components/features/movie-tracker/GroupSettingsForm';
import { LeaveGroupButton } from '@/components/features/movie-tracker/LeaveGroupButton';
import {
  RECORDS_READS,
  SOCIAL_READS,
  WATCHLIST_READS,
} from '@/components/features/movie-tracker/read-invalidation';
import { useWatchedRecords } from '@/components/features/movie-tracker/record-store';
import { SettingsView } from '@/components/features/movie-tracker/SettingsView';
import {
  decideFriendship,
  joinGroupRemote,
  removeFriend,
} from '@/components/features/movie-tracker/social-actions';
import type { Movie, WatchedRecord, WatchlistItem } from '@/components/features/movie-tracker/types';
import { useWatchlist } from '@/components/features/movie-tracker/watchlist-store';
import { ToastProvider } from '@/components/ui/toast';

const movie: Movie = {
  tmdbId: 27205,
  kind: 'film',
  title: 'Начало',
  year: 2010,
  rating: 8.4,
  genres: ['Фантастика'],
  posterUrl: null,
};

const record: WatchedRecord = {
  id: 7,
  movie,
  rating: 9,
  comment: '',
  watchedAt: '2024-01-01',
};

const watchlistItem: WatchlistItem = { id: 7, movie, addedAt: '2024-01-01' };

let reloads: string[] = [];

function stubFetch() {
  reloads = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.cache === 'reload') {
        reloads.push(url);
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ id: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
}

beforeEach(() => {
  stubFetch();
  refreshMock.mockClear();
  pushMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function expectReloads(expected: readonly string[]): void {
  for (const url of expected) {
    expect(reloads).toContain(url);
  }
}

function SaveRecordButton() {
  const { upsert } = useWatchedRecords([]);
  return (
    <button
      type="button"
      onClick={() =>
        upsert({ id: movie.tmdbId, movie, rating: 9, comment: '', watchedAt: '2024-01-01' })
      }
    >
      save record
    </button>
  );
}

function DeleteRecordButton() {
  const { remove } = useWatchedRecords([record]);
  return (
    <button type="button" onClick={() => remove(record)}>
      delete record
    </button>
  );
}

function AddWatchlistButton() {
  const { add } = useWatchlist([]);
  return (
    <button type="button" onClick={() => add(movie)}>
      add to list
    </button>
  );
}

function RemoveWatchlistButton() {
  const { remove } = useWatchlist([watchlistItem]);
  return (
    <button type="button" onClick={() => remove(watchlistItem)}>
      remove from list
    </button>
  );
}

describe('record and watch-later mutations reload their reads', () => {
  it('reloads records and watch-later after a record is saved', async () => {
    render(<SaveRecordButton />);
    await userEvent.click(screen.getByRole('button', { name: 'save record' }));
    await waitFor(() => expectReloads(RECORDS_READS));
  });

  it('reloads records and watch-later after a record is deleted', async () => {
    render(<DeleteRecordButton />);
    await userEvent.click(screen.getByRole('button', { name: 'delete record' }));
    await waitFor(() => expectReloads(RECORDS_READS));
  });

  it('reloads the watch-later reads after a title is added to the list', async () => {
    render(<AddWatchlistButton />);
    await userEvent.click(screen.getByRole('button', { name: 'add to list' }));
    await waitFor(() => expectReloads(WATCHLIST_READS));
  });

  it('reloads the watch-later reads after a title is removed from the list', async () => {
    render(<RemoveWatchlistButton />);
    await userEvent.click(screen.getByRole('button', { name: 'remove from list' }));
    await waitFor(() => expectReloads(WATCHLIST_READS));
  });
});

describe('profile and settings saves reload the identity reads', () => {
  it('reloads the identity and privacy reads after a privacy save', async () => {
    render(
      <ToastProvider>
        <SettingsView initialProfileHidden={false} initialStatsHidden={false} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Скрыть профиль' }));

    await waitFor(() => {
      expect(reloads).toContain('/api/me/identity');
      expect(reloads).toContain('/api/me/privacy');
      expect(reloads).toContain('/api/me/profile');
      expect(reloads).toContain('/api/me/stats');
    });
  });

  it('reloads the identity and privacy reads after an identity save', async () => {
    render(
      <ToastProvider>
        <EditIdentityModal open field="name" currentValue="Алексей" onClose={() => undefined} />
      </ToastProvider>,
    );

    const input = screen.getByRole('textbox', { name: 'Отображаемое имя' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Ник');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(reloads).toContain('/api/me/identity');
      expect(reloads).toContain('/api/me/privacy');
      expect(reloads).toContain('/api/me/profile');
      expect(reloads).toContain('/api/me/stats');
    });
  });
});

describe('friendship and group mutations reload the social lists', () => {
  it('reloads the lists after a friendship is accepted', async () => {
    await decideFriendship(7, 'accept');
    await waitFor(() => expectReloads(SOCIAL_READS));
  });

  it('reloads the lists after a friendship is removed', async () => {
    await removeFriend(7);
    await waitFor(() => expectReloads(SOCIAL_READS));
  });

  it('reloads the lists after a group is joined', async () => {
    await joinGroupRemote(3);
    await waitFor(() => expectReloads(SOCIAL_READS));
  });

  it('reloads the lists after a group is left', async () => {
    render(
      <ToastProvider>
        <LeaveGroupButton groupId={3} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Покинуть группу' }));
    await waitFor(() => expectReloads(SOCIAL_READS));
  });

  it('reloads the lists after a member is removed', async () => {
    render(
      <ToastProvider>
        <AdminMemberPanel
          group={{
            id: 3,
            name: 'Клуб',
            tags: [],
            stats: { films: 0, series: 0, genres: [], years: [] },
            members: [
              { id: 1, name: 'Админ', handle: 'admin', role: 'admin' },
              { id: 2, name: 'Гость', handle: 'guest', role: 'member' },
            ],
          }}
          isAdmin
          currentUserId={1}
        />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Удалить Гость из группы' }));
    await waitFor(() => expectReloads(SOCIAL_READS));
  });

  it('reloads the lists after the group is dissolved', async () => {
    render(
      <ToastProvider>
        <DissolveGroupButton groupId={3} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Распустить группу' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить роспуск' }));
    await waitFor(() => expectReloads(SOCIAL_READS));
  });
});

describe('group mutations reload the group read in place', () => {
  it('reloads the group read after a discussion is created', async () => {
    render(
      <ToastProvider>
        <GroupDiscussions
          groupId={3}
          isMember
          isAdmin
          discussions={[]}
          activeDiscussion={null}
          onOpenDiscussion={() => undefined}
          onCloseDiscussion={() => undefined}
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Создать обсуждение' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Название темы' }), 'Новая тема');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => expect(reloads).toContain('/api/groups/3'));
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('reloads the group and list reads after settings are saved', async () => {
    render(
      <ToastProvider>
        <GroupSettingsForm group={{ id: 3, name: 'Клуб', tags: [] }} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(reloads).toContain('/api/groups/3');
      expect(reloads).toContain('/api/groups');
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
