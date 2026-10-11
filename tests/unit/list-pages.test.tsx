import { render, screen } from '@testing-library/react';
import { Suspense, isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ok } from '@/core/result';

const { getActorMock, listCatalogMock, listWatchlistMock, redirectMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  listCatalogMock: vi.fn(),
  listWatchlistMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));
vi.mock('@/modules/catalog', () => ({ listCatalog: listCatalogMock }));
vi.mock('@/modules/watchlist', () => ({ listWatchlist: listWatchlistMock }));
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

import FilmsPage from '@/app/(app)/films/page';
import SeriesPage from '@/app/(app)/series/page';
import { FilmsData, SeriesData } from '@/components/features/movie-tracker/ListSections';

const actor = { id: 1, role: 'employee' as const };

function findAll(
  node: ReactNode,
  predicate: (element: ReactElement<Record<string, unknown>>) => boolean,
): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findAll(child, predicate));
  }
  if (!isValidElement(node)) {
    return [];
  }
  const element = node as ReactElement<Record<string, unknown>>;
  const found = predicate(element) ? [element] : [];
  return found.concat(findAll(element.props['children'] as ReactNode, predicate));
}

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(actor);
  listCatalogMock.mockResolvedValue(ok([]));
  listWatchlistMock.mockResolvedValue(ok([]));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('list sections', () => {
  it('streams the film list for the actor', async () => {
    render(await FilmsData({ actor }));
    expect(screen.getByRole('navigation', { name: 'Мои фильмы' })).toBeInTheDocument();
    expect(listCatalogMock).toHaveBeenCalledWith(1, 'film');
    expect(listWatchlistMock).toHaveBeenCalledWith(actor, 'film');
  });

  it('streams the series list for the actor', async () => {
    render(await SeriesData({ actor }));
    expect(screen.getByRole('navigation', { name: 'Мои сериалы' })).toBeInTheDocument();
    expect(listCatalogMock).toHaveBeenCalledWith(1, 'series');
  });
});

describe('list page shell', () => {
  it('returns the header and a streaming skeleton before the data section', async () => {
    const tree = await FilmsPage();

    const headings = findAll(
      tree,
      (element) => element.props['className'] === 'text-2xl font-semibold tracking-tight',
    );
    expect(String(headings[0]!.props['children'])).toBe('Мои фильмы');

    const suspenses = findAll(tree, (element) => element.type === Suspense);
    expect(suspenses).toHaveLength(1);
    render(suspenses[0]!.props['fallback'] as ReactNode);
    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument();
    expect(listCatalogMock).not.toHaveBeenCalled();
  });

  it('redirects to login without an actor', async () => {
    getActorMock.mockResolvedValue(null);
    await expect(FilmsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('returns the series shell header', async () => {
    const tree = await SeriesPage();
    const headings = findAll(
      tree,
      (element) => element.props['className'] === 'text-2xl font-semibold tracking-tight',
    );
    expect(String(headings[0]!.props['children'])).toBe('Мои сериалы');
  });
});
