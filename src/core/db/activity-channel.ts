import { Client } from 'pg';

import { env } from '@/core/config/env';
import { log } from '@/core/log/logger';

export const ACTIVITY_CHANNEL = 'activity_events';

type ActivityListener = (eventId: string) => void;

type ChannelState = {
  client: Client | null;
  listeners: Set<ActivityListener>;
  connecting: Promise<void> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
};

const globalForChannel = globalThis as unknown as { __activityChannel?: ChannelState };

const RECONNECT_MS = 2_000;

function getState(): ChannelState {
  if (!globalForChannel.__activityChannel) {
    globalForChannel.__activityChannel = {
      client: null,
      listeners: new Set(),
      connecting: null,
      retryTimer: null,
    };
  }
  return globalForChannel.__activityChannel;
}

function scheduleReconnect(state: ChannelState): void {
  if (state.retryTimer || state.listeners.size === 0) {
    return;
  }
  state.retryTimer = setTimeout(() => {
    state.retryTimer = null;
    void ensureConnected(state);
  }, RECONNECT_MS);
  const timer = state.retryTimer as unknown as { unref?: () => void };
  timer.unref?.();
}

async function connect(state: ChannelState): Promise<void> {
  const client = new Client({ connectionString: env.DATABASE_URL });
  client.on('notification', (message) => {
    if (message.channel !== ACTIVITY_CHANNEL || !message.payload) {
      return;
    }
    for (const listener of state.listeners) {
      try {
        listener(message.payload);
      } catch (error) {
        log('error', 'activity.listener_failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });
  client.on('error', (error) => {
    log('warn', 'activity.listener_error', { error: error.message });
    state.client = null;
    scheduleReconnect(state);
  });
  client.on('end', () => {
    state.client = null;
    scheduleReconnect(state);
  });

  await client.connect();
  await client.query(`LISTEN ${ACTIVITY_CHANNEL}`);
  state.client = client;
}

async function ensureConnected(state: ChannelState): Promise<void> {
  if (state.client) {
    return;
  }
  if (!state.connecting) {
    state.connecting = connect(state)
      .catch((error) => {
        log('warn', 'activity.listener_connect_failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        scheduleReconnect(state);
      })
      .finally(() => {
        state.connecting = null;
      });
  }
  await state.connecting;
}

export async function subscribeToActivity(
  listener: ActivityListener,
): Promise<() => void> {
  const state = getState();
  state.listeners.add(listener);
  await ensureConnected(state);
  return () => {
    state.listeners.delete(listener);
  };
}

export async function closeActivityChannel(): Promise<void> {
  const state = getState();
  if (state.retryTimer) {
    clearTimeout(state.retryTimer);
    state.retryTimer = null;
  }
  state.listeners.clear();
  const client = state.client;
  state.client = null;
  if (client) {
    await client.end().catch(() => undefined);
  }
}
