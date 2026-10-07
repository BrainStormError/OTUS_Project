import { beforeEach, describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const {
  getActorMock,
  createDiscussionMock,
  addCommentMock,
  saveGroupRatingMock,
  attachDiscussionMock,
} = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  createDiscussionMock: vi.fn(),
  addCommentMock: vi.fn(),
  saveGroupRatingMock: vi.fn(),
  attachDiscussionMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/discussions', async () => {
  const schema = await vi.importActual<typeof import('@/modules/discussions/schema')>(
    '@/modules/discussions/schema',
  );
  return {
    createDiscussionInput: schema.createDiscussionInput,
    createPostInput: schema.createPostInput,
    attachDiscussionInput: schema.attachDiscussionInput,
    createDiscussion: createDiscussionMock,
    addComment: addCommentMock,
    attachDiscussion: attachDiscussionMock,
  };
});

vi.mock('@/modules/groups', async () => {
  const schema = await vi.importActual<typeof import('@/modules/groups/schema')>(
    '@/modules/groups/schema',
  );
  return {
    groupRatingInput: schema.groupRatingInput,
    saveGroupRating: saveGroupRatingMock,
  };
});

import { POST as addCommentRoute } from '@/app/api/discussions/[id]/posts/route';
import { POST as createDiscussionRoute } from '@/app/api/groups/[id]/discussions/route';
import { POST as attachRoute } from '@/app/api/groups/[id]/ratings/[media]/discussion/route';
import { POST as saveRatingRoute } from '@/app/api/groups/[id]/ratings/route';

const actor = { id: 1, role: 'employee' as const };
const groupId = 3;
const discussionId = 4;
const mediaId = 10;
const origin = { origin: 'http://localhost:3000' };

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/groups/[id]/discussions', () => {
  const context = { params: Promise.resolve({ id: '3' }) };

  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await createDiscussionRoute(
      post('http://localhost/api/groups/x/discussions', { title: 'Тема' }),
      context,
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 for a non-numeric group id', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await createDiscussionRoute(
      post('http://localhost/api/groups/x/discussions', { title: 'Тема' }),
      { params: Promise.resolve({ id: 'x' }) },
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 for an invalid body', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await createDiscussionRoute(
      post('http://localhost/api/groups/x/discussions', {}),
      context,
    );
    expect(response.status).toBe(400);
  });

  it('maps a forbidden creation to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    createDiscussionMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await createDiscussionRoute(
      post('http://localhost/api/groups/x/discussions', { title: 'Тема' }),
      context,
    );
    expect(response.status).toBe(403);
    expect(createDiscussionMock).toHaveBeenCalledWith(actor, { title: 'Тема', groupId });
  });

  it('creates a discussion for an admin', async () => {
    getActorMock.mockResolvedValue(actor);
    createDiscussionMock.mockResolvedValue(ok({ id: discussionId }));
    const response = await createDiscussionRoute(
      post('http://localhost/api/groups/x/discussions', { title: 'Тема' }),
      context,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: discussionId });
  });
});

describe('POST /api/discussions/[id]/posts', () => {
  const context = { params: Promise.resolve({ id: '4' }) };

  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await addCommentRoute(
      post('http://localhost/api/discussions/x/posts', { body: 'Привет' }),
      context,
    );
    expect(response.status).toBe(401);
  });

  it('maps a non-member comment to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    addCommentMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await addCommentRoute(
      post('http://localhost/api/discussions/x/posts', { body: 'Привет' }),
      context,
    );
    expect(response.status).toBe(403);
    expect(addCommentMock).toHaveBeenCalledWith(actor, { body: 'Привет', discussionId });
  });

  it('returns 400 for an empty body', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await addCommentRoute(
      post('http://localhost/api/discussions/x/posts', { body: '   ' }),
      context,
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/groups/[id]/ratings', () => {
  const context = { params: Promise.resolve({ id: '3' }) };

  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await saveRatingRoute(
      post('http://localhost/api/groups/x/ratings', { rating: 8 }),
      context,
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 for an out-of-range rating', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await saveRatingRoute(
      post('http://localhost/api/groups/x/ratings', {
        mediaKind: 'film',
        mediaRef: '27205',
        title: 'Начало',
        rating: 11,
        watchedAt: '2026-08-12',
      }),
      context,
    );
    expect(response.status).toBe(400);
  });

  it('maps a non-member rating to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    saveGroupRatingMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await saveRatingRoute(
      post('http://localhost/api/groups/x/ratings', {
        mediaKind: 'film',
        mediaRef: '27205',
        title: 'Начало',
        rating: 8,
        watchedAt: '2026-08-12',
      }),
      context,
    );
    expect(response.status).toBe(403);
    expect(saveGroupRatingMock).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ groupId, mediaRef: '27205', rating: 8 }),
    );
  });
});

describe('POST /api/groups/[id]/ratings/[media]/discussion', () => {
  const context = { params: Promise.resolve({ id: '3', media: '10' }) };

  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await attachRoute(
      post('http://localhost/api/groups/x/ratings/10/discussion', { title: 'Обсуждаем' }),
      context,
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 for a non-numeric media segment', async () => {
    getActorMock.mockResolvedValue(actor);
    const response = await attachRoute(
      post('http://localhost/api/groups/x/ratings/nope/discussion', { title: 'Обсуждаем' }),
      { params: Promise.resolve({ id: '3', media: 'nope' }) },
    );
    expect(response.status).toBe(400);
  });

  it('maps an unrated media attach to 400', async () => {
    getActorMock.mockResolvedValue(actor);
    attachDiscussionMock.mockResolvedValue(err('VALIDATION', 'Медиа не оценено'));
    const response = await attachRoute(
      post('http://localhost/api/groups/x/ratings/10/discussion', { title: 'Обсуждаем' }),
      context,
    );
    expect(response.status).toBe(400);
    expect(attachDiscussionMock).toHaveBeenCalledWith(actor, {
      groupId,
      mediaId,
      title: 'Обсуждаем',
    });
  });

  it('maps a non-admin attach to 403', async () => {
    getActorMock.mockResolvedValue(actor);
    attachDiscussionMock.mockResolvedValue(err('FORBIDDEN', 'Нет прав'));
    const response = await attachRoute(
      post('http://localhost/api/groups/x/ratings/10/discussion', { title: 'Обсуждаем' }),
      context,
    );
    expect(response.status).toBe(403);
  });
});
