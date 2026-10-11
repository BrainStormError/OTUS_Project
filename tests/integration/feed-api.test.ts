import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Actor } from '@/core/auth/policy';

const state = vi.hoisted(() => ({ actor: null as Actor | null }));

vi.mock('@/modules/auth/session', () => ({
  getActor: async () => state.actor,
}));

import { GET as getFeed } from '@/app/api/feed/route';
import { GET as getStream } from '@/app/api/feed/stream/route';
import { POST as postAccept } from '@/app/api/friendships/accept/route';
import { POST as postJoin } from '@/app/api/groups/join/route';
import { POST as postRecord } from '@/app/api/records/route';
import { closeActivityChannel } from '@/core/db/activity-channel';
import { closePool, query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';
import { MAX_STREAM_CONNECTIONS_PER_IDENTITY } from '@/core/http/stream-guard';
import { recordEvent } from '@/modules/activity';
import { insertUser } from '@/modules/auth/repository';

import { installTmdbFetch } from './tmdb-stub';

beforeAll(() => {
  installTmdbFetch((ref) => ({ title: ref === '27205' ? 'Начало' : `media-${ref}`, year: 2010 }));
});

const { databaseUrl } = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/integration/.db-url.json'), 'utf8'),
) as { databaseUrl: string };

const TRUSTED = 'http://localhost:3000';

async function makeUser(handle: string): Promise<Actor> {
  const row = await insertUser({
    email: `${randomUUID()}@example.com`,
    name: handle,
    role: 'employee',
  });
  await query('UPDATE users SET handle = $2 WHERE id = $1', [row.id, handle]);
  return { id: row.id, role: 'employee' };
}

function mutation(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request(`${TRUSTED}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function countEvents(actorId: number): Promise<number> {
  const rows = await query<{ count: number }>(
    'SELECT count(*)::int AS count FROM activity_events WHERE actor_id = $1',
    [actorId],
  );
  return Number(rows[0]?.count ?? 0);
}

afterAll(async () => {
  await closeActivityChannel();
  await closePool();
});

describe('GET /api/feed', () => {
  it('requires authentication', async () => {
    state.actor = null;
    const response = await getFeed(new Request(`${TRUSTED}/api/feed`));
    expect(response.status).toBe(401);
  });

  it('pages with a cursor and catches up from a since cursor without duplicates', async () => {
    const viewer = await makeUser(`api-feed-${randomUUID().slice(0, 8)}`);
    state.actor = viewer;

    for (let index = 0; index < 4; index += 1) {
      await withTransaction((tx) =>
        recordEvent(tx, {
          actorId: viewer.id,
          kind: 'friendship_accepted',
        }),
      );
    }

    const first = await getFeed(
      new Request(`${TRUSTED}/api/feed?limit=2`, { headers: { origin: TRUSTED } }),
    );
    expect(first.status).toBe(200);
    const firstPage = (await first.json()) as {
      items: { id: number; cursor: string }[];
      nextCursor: string | null;
    };
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).not.toBeNull();

    const second = await getFeed(
      new Request(
        `${TRUSTED}/api/feed?limit=2&cursor=${encodeURIComponent(firstPage.nextCursor ?? '')}`,
        { headers: { origin: TRUSTED } },
      ),
    );
    expect(second.status).toBe(200);
    const secondPage = (await second.json()) as { items: { id: number }[] };
    const firstIds = firstPage.items.map((item) => item.id);
    expect(secondPage.items.some((item) => firstIds.includes(item.id))).toBe(false);

    const since = firstPage.items[1]!.cursor;
    const catchup = await getFeed(
      new Request(`${TRUSTED}/api/feed?since=${encodeURIComponent(since)}`, {
        headers: { origin: TRUSTED },
      }),
    );
    expect(catchup.status).toBe(200);
    const catchupPage = (await catchup.json()) as { items: { id: number }[] };
    expect(catchupPage.items).toHaveLength(1);
    expect(catchupPage.items[0]!.id).toBe(firstPage.items[0]!.id);
  });

  it('rejects a malformed cursor', async () => {
    const viewer = await makeUser(`api-feed-bad-${randomUUID().slice(0, 8)}`);
    state.actor = viewer;
    const response = await getFeed(
      new Request(`${TRUSTED}/api/feed?cursor=not-a-cursor`, {
        headers: { origin: TRUSTED },
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST mutation routes', () => {
  it('rejects an untrusted origin before checking the actor', async () => {
    state.actor = null;
    const response = await postRecord(
      mutation('/api/records', {}, { 'sec-fetch-site': 'cross-site' }),
    );
    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request from a trusted origin', async () => {
    state.actor = null;
    const response = await postRecord(
      mutation('/api/records', {}, { origin: TRUSTED }),
    );
    expect(response.status).toBe(401);
  });

  it('writes a watched record and emits an activity event', async () => {
    const actor = await makeUser(`api-rate-${randomUUID().slice(0, 8)}`);
    state.actor = actor;

    const response = await postRecord(
      mutation(
        '/api/records',
        {
          mediaKind: 'film',
          mediaRef: '27205',
          rating: 9,
          watchedAt: '2026-08-12',
        },
        { origin: TRUSTED },
      ),
    );
    expect(response.status).toBe(200);
    expect(await countEvents(actor.id)).toBe(1);
  });

  it('accepts a friendship through the route', async () => {
    const requester = await makeUser(`api-req-${randomUUID().slice(0, 8)}`);
    const addressee = await makeUser(`api-addr-${randomUUID().slice(0, 8)}`);
    const rows = await query<{ id: number }>(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 0) RETURNING id`,
      [requester.id, addressee.id],
    );
    state.actor = addressee;

    const response = await postAccept(
      mutation('/api/friendships/accept', { friendshipId: rows[0]!.id }, { origin: TRUSTED }),
    );
    expect(response.status).toBe(200);
    expect(await countEvents(addressee.id)).toBe(1);
  });

  it('joins an open group and refuses a restricted one', async () => {
    const actor = await makeUser(`api-join-${randomUUID().slice(0, 8)}`);
    state.actor = actor;
    const open = await query<{ id: number }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      [`api-open-${randomUUID().slice(0, 8)}`],
    );
    const closed = await query<{ id: number }>(
      `INSERT INTO groups (name, restricted) VALUES ($1, true) RETURNING id`,
      [`api-closed-${randomUUID().slice(0, 8)}`],
    );

    const joined = await postJoin(
      mutation('/api/groups/join', { groupId: open[0]!.id }, { origin: TRUSTED }),
    );
    expect(joined.status).toBe(200);

    const refused = await postJoin(
      mutation('/api/groups/join', { groupId: closed[0]!.id }, { origin: TRUSTED }),
    );
    expect(refused.status).toBe(403);
  });
});

describe('GET /api/feed/stream', () => {
  it('streams an event emitted after subscription and resumes via Last-Event-ID', async () => {
    const viewer = await makeUser(`api-stream-${randomUUID().slice(0, 8)}`);
    state.actor = viewer;

    const older = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: viewer.id,
        kind: 'friendship_accepted',
      }),
    );

    const controller = new AbortController();
    const response = await getStream(
      new Request(`${TRUSTED}/api/feed/stream`, {
        headers: { origin: TRUSTED, 'last-event-id': '' },
        signal: controller.signal,
      }),
    );
    expect(response.status).toBe(200);
    const reader = response.body!.getReader();

    await readUntil(reader, ': connected');

    const newer = await withTransaction((tx) =>
      recordEvent(tx, {
        actorId: viewer.id,
        kind: 'friendship_accepted',
      }),
    );

    const live = await readUntil(reader, 'event: activity');
    expect(live).toContain(String(newer.id));

    controller.abort();

    const resumeController = new AbortController();
    const resumeResponse = await getStream(
      new Request(`${TRUSTED}/api/feed/stream`, {
        headers: { origin: TRUSTED, 'last-event-id': encode(older) },
        signal: resumeController.signal,
      }),
    );
    const resumeReader = resumeResponse.body!.getReader();
    const resumed = await readUntil(resumeReader, String(newer.id));
    expect(resumed).toContain(String(newer.id));
    resumeController.abort();
  });

  it('refuses a connection past the per-identity cap and frees a slot on disconnect', async () => {
    const viewer = await makeUser(`api-cap-${randomUUID().slice(0, 8)}`);
    state.actor = viewer;

    const controllers: AbortController[] = [];
    try {
      for (let index = 0; index < MAX_STREAM_CONNECTIONS_PER_IDENTITY; index += 1) {
        const controller = new AbortController();
        controllers.push(controller);
        const response = await getStream(
          new Request(`${TRUSTED}/api/feed/stream`, {
            headers: { origin: TRUSTED },
            signal: controller.signal,
          }),
        );
        expect(response.status).toBe(200);
        await readUntil(response.body!.getReader(), ': connected');
      }

      const over = await getStream(
        new Request(`${TRUSTED}/api/feed/stream`, { headers: { origin: TRUSTED } }),
      );
      expect(over.status).toBe(429);

      controllers[0]!.abort();

      let freed: Response | null = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = await getStream(
          new Request(`${TRUSTED}/api/feed/stream`, { headers: { origin: TRUSTED } }),
        );
        if (candidate.status === 200) {
          freed = candidate;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(freed?.status).toBe(200);
    } finally {
      for (const controller of controllers) {
        controller.abort();
      }
    }
  });
});

function encode(event: { createdAt: string; id: number }): string {
  return Buffer.from(`${event.createdAt}|${event.id}`, 'utf8').toString('base64url');
}

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  needle: string,
  timeoutMs = 10_000,
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  const deadline = Date.now() + timeoutMs;
  while (!buffer.includes(needle)) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`Timed out waiting for "${needle}". Received: ${buffer}`);
    }
    const next = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out waiting for "${needle}"`)), remaining),
      ),
    ]);
    if (next.done) break;
    buffer += decoder.decode(next.value, { stream: true });
  }
  return buffer;
}
