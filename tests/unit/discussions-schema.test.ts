import { describe, expect, it } from 'vitest';

import {
  attachDiscussionInput,
  createDiscussionInput,
  createPostInput,
} from '@/modules/discussions';

const groupId = 3;
const discussionId = 4;

describe('createDiscussionInput', () => {
  it('accepts a plain topic', () => {
    const parsed = createDiscussionInput.safeParse({ groupId: '3', title: '  Тема  ' });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.groupId).toBe(3);
  });

  it('accepts a media link with a numeric media id', () => {
    const parsed = createDiscussionInput.safeParse({ groupId, title: 'Тема', mediaId: '10' });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.mediaId).toBe(10);
  });

  it('rejects a non-positive media id', () => {
    expect(createDiscussionInput.safeParse({ groupId, title: 'Тема', mediaId: 0 }).success).toBe(
      false,
    );
  });

  it('rejects an empty title', () => {
    expect(createDiscussionInput.safeParse({ groupId, title: '   ' }).success).toBe(false);
  });
});

describe('createPostInput', () => {
  it('accepts a trimmed body', () => {
    expect(createPostInput.safeParse({ discussionId, body: '  Привет  ' }).success).toBe(true);
  });

  it('rejects an empty body', () => {
    expect(createPostInput.safeParse({ discussionId, body: '   ' }).success).toBe(false);
  });

  it('rejects a comment over 1000 characters', () => {
    expect(
      createPostInput.safeParse({ discussionId, body: 'я'.repeat(1001) }).success,
    ).toBe(false);
    expect(
      createPostInput.safeParse({ discussionId, body: 'я'.repeat(1000) }).success,
    ).toBe(true);
  });
});

describe('attachDiscussionInput', () => {
  it('requires the media id and title', () => {
    expect(
      attachDiscussionInput.safeParse({ groupId, mediaId: 10, title: 'Тема' }).success,
    ).toBe(true);
    expect(attachDiscussionInput.safeParse({ groupId, title: 'Тема' }).success).toBe(false);
  });
});
