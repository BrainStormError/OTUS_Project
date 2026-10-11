import { toFeedEvent } from '@/components/features/movie-tracker/feed';
import { subscribeToActivity } from '@/core/db/activity-channel';
import { getSharedRateLimiter } from '@/core/http/rate-limit';
import { json } from '@/core/http/responses';
import { acquireStreamSlot, releaseStreamSlot } from '@/core/http/stream-guard';
import { getVisibleEvent, listFeed, MAX_FEED_LIMIT } from '@/modules/activity';
import { getActor } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

const HEARTBEAT_MS = 25_000;
const CONNECT_LIMIT = 10;
const CONNECT_WINDOW_MS = 60_000;

export async function GET(request: Request): Promise<Response> {
  const actor = await getActor();
  if (!actor) {
    return json({ error: 'Требуется вход' }, 401);
  }

  const allowed = await getSharedRateLimiter().consume(
    `feed.stream.connect:${actor.id}`,
    CONNECT_LIMIT,
    CONNECT_WINDOW_MS,
  );
  if (!allowed) {
    return json({ error: 'Слишком много подключений' }, 429);
  }

  if (!acquireStreamSlot(actor.id)) {
    return json({ error: 'Слишком много потоков' }, 429);
  }

  const identity = actor.id;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    releaseStreamSlot(identity);
  };

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // The client has already disconnected.
        }
      };

      const sendItem = (item: Awaited<ReturnType<typeof getVisibleEvent>>) => {
        if (!item) return;
        const event = toFeedEvent(item, actor.id);
        send(`event: activity\nid: ${event.cursor}\ndata: ${JSON.stringify(event)}\n\n`);
      };

      request.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe?.();
        release();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      });

      unsubscribe = await subscribeToActivity((eventId) => {
        const parsedId = Number(eventId);
        if (!Number.isInteger(parsedId)) return;
        void getVisibleEvent(actor.id, parsedId).then(sendItem);
      });

      send(': connected\n\n');

      const lastEventId = request.headers.get('last-event-id');
      if (lastEventId) {
        const catchup = await listFeed(actor, { limit: MAX_FEED_LIMIT, since: lastEventId });
        if (catchup.ok) {
          for (const item of [...catchup.value.items].reverse()) {
            sendItem(item);
          }
        }
      }

      heartbeat = setInterval(() => send(': heartbeat\n\n'), HEARTBEAT_MS);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
      release();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}
