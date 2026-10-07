import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGroupRoleMock, hasGroupRatingMock, findDiscussionByIdMock } = vi.hoisted(() => ({
  getGroupRoleMock: vi.fn(),
  hasGroupRatingMock: vi.fn(),
  findDiscussionByIdMock: vi.fn(),
}));

vi.mock('@/modules/groups', () => ({
  getGroupRole: getGroupRoleMock,
  hasGroupRating: hasGroupRatingMock,
}));

vi.mock('@/modules/discussions/repository', () => ({
  findDiscussionById: findDiscussionByIdMock,
  listDiscussions: vi.fn(),
  insertDiscussion: vi.fn(),
  insertPost: vi.fn(),
  listPosts: vi.fn(),
}));

import { addComment, attachDiscussion, createDiscussion } from '@/modules/discussions';

const actor = { id: 1, role: 'employee' as const };
const groupId = 3;
const discussionId = 4;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createDiscussion rejections', () => {
  it('rejects a non-member', async () => {
    getGroupRoleMock.mockResolvedValue(null);
    const result = await createDiscussion(actor, { groupId, title: 'Тема' });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('rejects a member without the admin role', async () => {
    getGroupRoleMock.mockResolvedValue('member');
    const result = await createDiscussion(actor, { groupId, title: 'Тема' });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('rejects attaching a discussion to unrated media', async () => {
    getGroupRoleMock.mockResolvedValue('admin');
    hasGroupRatingMock.mockResolvedValue(false);
    const result = await createDiscussion(actor, { groupId, title: 'Тема', mediaId: 10 });
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION' });
  });
});

describe('attachDiscussion rejections', () => {
  it('rejects a member without the admin role', async () => {
    getGroupRoleMock.mockResolvedValue('member');
    const result = await attachDiscussion(actor, { groupId, title: 'Тема', mediaId: 10 });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('rejects a non-member', async () => {
    getGroupRoleMock.mockResolvedValue(null);
    const result = await attachDiscussion(actor, { groupId, title: 'Тема', mediaId: 10 });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});

describe('addComment rejections', () => {
  it('rejects an unknown discussion', async () => {
    findDiscussionByIdMock.mockResolvedValue(null);
    const result = await addComment(actor, { discussionId, body: 'Привет' });
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });

  it('rejects a non-member', async () => {
    findDiscussionByIdMock.mockResolvedValue({ id: discussionId, groupId });
    getGroupRoleMock.mockResolvedValue(null);
    const result = await addComment(actor, { discussionId, body: 'Привет' });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});
