import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/core/result';

const { getActorMock, listMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  listMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/activity', async () => {
  const schema = await vi.importActual<typeof import('@/modules/activity/schema')>(
    '@/modules/activity/schema',
  );
  return { listFeedInput: schema.listFeedInput, listFeed: listMock };
});

import { GET as feedRoute } from '@/app/api/feed/route';

const actor = { id: 1, role: 'employee' as const };

describe('GET /api/feed', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await feedRoute(new Request('http://localhost/api/feed'));
    expect(response.status).toBe(401);
  });

  it('caches the feed in the browser for at most sixty seconds', async () => {
    getActorMock.mockResolvedValue(actor);
    listMock.mockResolvedValue(ok({ items: [], nextCursor: null }));

    const response = await feedRoute(new Request('http://localhost/api/feed'));
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('cache-control') ?? '';
    expect(cacheControl).toBe('private, max-age=60');
    expect(cacheControl).not.toContain('public');
    expect(cacheControl).not.toContain('s-maxage');
  });
});
