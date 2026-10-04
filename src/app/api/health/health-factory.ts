import { withTimeout } from '@/core/http/timeout';
import { log } from '@/core/log/logger';

export const HEALTH_TIMEOUT_MS = 2000;

export function createHealthHandler(
  ping: () => Promise<void>,
  timeoutMs: number = HEALTH_TIMEOUT_MS,
): () => Promise<Response> {
  return async function health(): Promise<Response> {
    try {
      await withTimeout(ping(), timeoutMs);
      return Response.json({ status: 'ok' });
    } catch {
      log('warn', 'readiness', { status: 'unavailable' });
      return Response.json({ status: 'unavailable' }, { status: 503 });
    }
  };
}
