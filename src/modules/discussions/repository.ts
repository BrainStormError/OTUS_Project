import type { PoolClient } from 'pg';

import { query } from '@/core/db/pool';

import type { DiscussionPost, DiscussionSummary } from './types';

type DiscussionRow = {
  id: number;
  group_id: number;
  author_id: number;
  title: string;
  media_id: number | null;
  created_at: Date;
  author_name: string | null;
  author_handle: string | null;
  comment_count: number;
};

type PostRow = {
  id: number;
  discussion_id: number;
  author_id: number;
  body: string;
  created_at: Date;
  author_name: string | null;
  author_handle: string | null;
};

const DISCUSSION_SELECT = `d.id, d.group_id, d.author_id, d.title, d.media_id,
  d.created_at, u.name AS author_name, u.handle AS author_handle,
  (SELECT count(*)::int FROM discussion_posts p WHERE p.discussion_id = d.id) AS comment_count`;

const DISCUSSION_FROM = `FROM group_discussions d
  JOIN users u ON u.id = d.author_id`;

function mapDiscussion(row: DiscussionRow): DiscussionSummary {
  return {
    id: row.id,
    groupId: row.group_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorHandle: row.author_handle,
    title: row.title,
    mediaId: row.media_id,
    commentCount: Number(row.comment_count),
    createdAt: row.created_at.toISOString(),
  };
}

function mapPost(row: PostRow): DiscussionPost {
  return {
    id: row.id,
    discussionId: row.discussion_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorHandle: row.author_handle,
    body: row.body,
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertDiscussion(
  tx: PoolClient,
  input: {
    groupId: number;
    authorId: number;
    title: string;
    mediaId: number | null;
  },
): Promise<DiscussionSummary> {
  const result = await tx.query<DiscussionRow>(
    `WITH inserted AS (
       INSERT INTO group_discussions (group_id, author_id, title, media_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *
     )
     SELECT ${DISCUSSION_SELECT}
       FROM inserted d
       JOIN users u ON u.id = d.author_id`,
    [input.groupId, input.authorId, input.title, input.mediaId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('insertDiscussion returned no row');
  }
  return mapDiscussion(row);
}

export async function listDiscussions(groupId: number): Promise<DiscussionSummary[]> {
  const rows = await query<DiscussionRow>(
    `SELECT ${DISCUSSION_SELECT}
       ${DISCUSSION_FROM}
      WHERE d.group_id = $1
      ORDER BY d.created_at DESC, d.id DESC`,
    [groupId],
  );
  return rows.map(mapDiscussion);
}

export async function findDiscussionById(id: number): Promise<DiscussionSummary | null> {
  const rows = await query<DiscussionRow>(
    `SELECT ${DISCUSSION_SELECT}
       ${DISCUSSION_FROM}
      WHERE d.id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? mapDiscussion(row) : null;
}

export async function listPosts(discussionId: number): Promise<DiscussionPost[]> {
  const rows = await query<PostRow>(
    `SELECT p.id, p.discussion_id, p.author_id, p.body, p.created_at,
            u.name AS author_name, u.handle AS author_handle
       FROM discussion_posts p
       JOIN users u ON u.id = p.author_id
      WHERE p.discussion_id = $1
      ORDER BY p.created_at ASC, p.id ASC`,
    [discussionId],
  );
  return rows.map(mapPost);
}

export async function insertPost(
  tx: PoolClient,
  input: { discussionId: number; authorId: number; body: string },
): Promise<DiscussionPost> {
  const result = await tx.query<PostRow>(
    `WITH inserted AS (
       INSERT INTO discussion_posts (discussion_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING *
     )
     SELECT inserted.id, inserted.discussion_id, inserted.author_id, inserted.body,
            inserted.created_at, u.name AS author_name, u.handle AS author_handle
       FROM inserted
       JOIN users u ON u.id = inserted.author_id`,
    [input.discussionId, input.authorId, input.body],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('insertPost returned no row');
  }
  return mapPost(row);
}
