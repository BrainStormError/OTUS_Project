import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/films',
  useSearchParams: () => new URLSearchParams(),
}));

import {
  OwnProfileScreen,
  SettingsScreen,
} from '@/components/features/movie-tracker/screens/auth-screens';
import { CatalogListScreen } from '@/components/features/movie-tracker/screens/catalog-screens';
import { GroupScreen } from '@/components/features/movie-tracker/screens/groups-screens';
import { HomeScreen } from '@/components/features/movie-tracker/screens/home-screen';

const filmRecord = {
  id: 1,
  userId: 1,
  mediaId: 10,
  mediaKind: 'film' as const,
  mediaRef: '27205',
  title: 'Начало',
  year: 2010,
  genres: ['Фантастика'],
  rating: 9,
  comment: null,
  watchedAt: '2024-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const BODIES: Record<string, unknown> = {
  '/api/genres?kind=film': { items: [] },
  '/api/genres?kind=series': { items: [] },
  '/api/records': { items: [filmRecord] },
  '/api/watchlist?kind=film': { items: [] },
  '/api/watchlist?kind=series': { items: [] },
  '/api/search?kind=film': { items: [] },
  '/api/me/privacy': { profileHidden: false, statsHidden: false },
  '/api/me/profile': {
    identity: {
      id: 1,
      handle: 'me',
      name: 'Алексей',
      profileHidden: false,
      statsHidden: false,
    },
    relationship: null,
    stats: { films: 1, series: 0, genres: [], years: [] },
    recent: [filmRecord],
  },
};

function callsTo(fetchMock: { mock: { calls: unknown[][] } }, url: string): unknown[] {
  return fetchMock.mock.calls.filter(([input]) => String(input) === url);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('store-backed screens fetch once per session', () => {
  it('serves My Films from the store when the screen mounts twice', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve(json(BODIES[url] ?? { items: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = render(<CatalogListScreen kind="film" />);
    await screen.findByTestId('my-films');
    first.unmount();

    render(<CatalogListScreen kind="film" />);
    await screen.findByTestId('my-films');

    expect(callsTo(fetchMock, '/api/records')).toHaveLength(1);
    expect(callsTo(fetchMock, '/api/watchlist?kind=film')).toHaveLength(1);
  });

  it('serves Home from the store when the screen mounts twice', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve(json(BODIES[url] ?? { items: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = render(<HomeScreen />);
    await screen.findByText('Популярное');
    first.unmount();

    render(<HomeScreen />);
    await screen.findByText('Популярное');

    for (const url of [
      '/api/genres?kind=film',
      '/api/genres?kind=series',
      '/api/records',
      '/api/watchlist?kind=film',
      '/api/watchlist?kind=series',
      '/api/search?kind=film',
    ]) {
      expect(callsTo(fetchMock, url)).toHaveLength(1);
    }
  });

  it('serves profile and settings from the store on repeat mounts', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve(json(BODIES[url] ?? { items: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const profile = render(<OwnProfileScreen />);
    await screen.findByText('Алексей');
    profile.unmount();
    render(<OwnProfileScreen />);
    await screen.findByText('Алексей');

    const settings = render(<SettingsScreen />);
    await screen.findByRole('switch', { name: 'Скрыть профиль' });
    settings.unmount();
    render(<SettingsScreen />);
    await screen.findByRole('switch', { name: 'Скрыть профиль' });

    expect(callsTo(fetchMock, '/api/me/profile')).toHaveLength(1);
    expect(callsTo(fetchMock, '/api/me/privacy')).toHaveLength(1);
  });

  it('serves a group from the store when the screen mounts twice', async () => {
    const groupRead = {
      group: {
        id: 3,
        name: 'Клуб',
        tags: [],
        stats: { films: 0, series: 0, genres: [], years: [] },
        members: [],
      },
      role: 'admin',
      discussions: [],
      ratings: [],
      activity: [],
      invitations: [],
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve(json(url === '/api/groups/3' ? groupRead : { items: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = render(<GroupScreen groupId={3} />);
    await screen.findByText('Клуб');
    first.unmount();

    render(<GroupScreen groupId={3} />);
    await screen.findByText('Клуб');

    expect(callsTo(fetchMock, '/api/groups/3')).toHaveLength(1);
  });
});

describe('loading state appears on cold start only', () => {
  it('renders nothing while the first load is pending and never again', async () => {
    const pending: { url: string; resolve: (response: Response) => void }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (input: RequestInfo | URL) =>
          new Promise<Response>((resolve) => {
            pending.push({ url: String(input), resolve });
          }),
      ),
    );

    const first = render(<CatalogListScreen kind="film" />);
    expect(first.container).toBeEmptyDOMElement();

    for (const item of pending) {
      item.resolve(json(BODIES[item.url] ?? { items: [] }));
    }
    await screen.findByTestId('my-films');
    first.unmount();

    const second = render(<CatalogListScreen kind="film" />);
    expect(screen.getByTestId('my-films')).toBeInTheDocument();
    expect(second.container).not.toBeEmptyDOMElement();
  });
});

describe('a failed resource surfaces an error with a retry', () => {
  it('reloads the resource when the retry is pressed', async () => {
    let recordsFailed = false;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/records' && !recordsFailed) {
        recordsFailed = true;
        return Promise.resolve(json({}, 500));
      }
      return Promise.resolve(json(BODIES[url] ?? { items: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CatalogListScreen kind="film" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Не удалось загрузить список.');

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    await waitFor(() => expect(screen.getByTestId('my-films')).toBeInTheDocument());
  });
});
