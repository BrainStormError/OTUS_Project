import { can, type Actor } from '@/core/auth/policy';
import { withTransaction } from '@/core/db/transaction';
import { err, ok, type Result } from '@/core/result';

import { recordEvent } from '@/modules/activity';
import { getGroupRole, hasGroupRating } from '@/modules/groups';

import {
  findDiscussionById,
  insertDiscussion,
  insertPost,
  listDiscussions as listDiscussionsRepository,
  listPosts,
} from './repository';
import type { AttachDiscussionInput, CreateDiscussionInput, CreatePostInput } from './schema';
import type { DiscussionDetail, DiscussionPost, DiscussionSummary } from './types';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505'
  );
}

async function create(
  actor: Actor,
  input: CreateDiscussionInput,
): Promise<Result<DiscussionSummary>> {
  const role = await getGroupRole(input.groupId, actor.id);
  if (!can(actor, 'group:discuss:create', { groupRole: role })) {
    return err('FORBIDDEN', 'Создавать обсуждения может только администратор группы');
  }

  const mediaId = input.mediaId ?? null;
  if (mediaId && !(await hasGroupRating(input.groupId, mediaId))) {
    return err('VALIDATION', 'Обсуждение можно прикрепить только к оценённому в группе медиа');
  }

  try {
    const discussion = await withTransaction(async (tx) => {
      const created = await insertDiscussion(tx, {
        groupId: input.groupId,
        authorId: actor.id,
        title: input.title,
        mediaId,
      });
      await recordEvent(tx, {
        actorId: actor.id,
        kind: 'post_created',
        groupId: input.groupId,
        discussionId: created.id,
      });
      return created;
    });
    return ok(discussion);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return err('CONFLICT', 'К этому медиа уже прикреплено обсуждение');
    }
    throw error;
  }
}

export async function createDiscussion(
  actor: Actor,
  input: CreateDiscussionInput,
): Promise<Result<DiscussionSummary>> {
  return create(actor, input);
}

export async function attachDiscussion(
  actor: Actor,
  input: AttachDiscussionInput,
): Promise<Result<DiscussionSummary>> {
  return create(actor, {
    groupId: input.groupId,
    title: input.title,
    mediaId: input.mediaId,
  });
}

export async function addComment(
  actor: Actor,
  input: CreatePostInput,
): Promise<Result<DiscussionPost>> {
  const discussion = await findDiscussionById(input.discussionId);
  if (!discussion) {
    return err('NOT_FOUND', 'Обсуждение не найдено');
  }

  const role = await getGroupRole(discussion.groupId, actor.id);
  if (!can(actor, 'group:discuss', { groupRole: role })) {
    return err('FORBIDDEN', 'Комментировать могут только участники группы');
  }

  const post = await withTransaction(async (tx) => {
    const created = await insertPost(tx, {
      discussionId: discussion.id,
      authorId: actor.id,
      body: input.body,
    });
    await recordEvent(tx, {
      actorId: actor.id,
      kind: 'comment_created',
      groupId: discussion.groupId,
      discussionId: discussion.id,
    });
    return created;
  });
  return ok(post);
}

export async function listDiscussions(
  groupId: number,
): Promise<Result<DiscussionSummary[]>> {
  return ok(await listDiscussionsRepository(groupId));
}

export async function getDiscussion(id: number): Promise<Result<DiscussionDetail>> {
  const discussion = await findDiscussionById(id);
  if (!discussion) {
    return err('NOT_FOUND', 'Обсуждение не найдено');
  }
  const posts = await listPosts(id);
  return ok({ ...discussion, posts });
}
