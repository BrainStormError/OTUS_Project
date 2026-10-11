// Bounds how many concurrent long-lived connections a single identity may hold.
// Without it one client can grow listeners, heartbeat timers, and sockets
// without limit (and each stream runs a per-event query). Counters are
// process-local and released on abort/cancel, so a finished stream frees its
// slot for a later connection from the same identity.
export const MAX_STREAM_CONNECTIONS_PER_IDENTITY = 4;

const active = new Map<number, number>();

export function acquireStreamSlot(identity: number): boolean {
  const current = active.get(identity) ?? 0;
  if (current >= MAX_STREAM_CONNECTIONS_PER_IDENTITY) {
    return false;
  }
  active.set(identity, current + 1);
  return true;
}

export function releaseStreamSlot(identity: number): void {
  const current = active.get(identity) ?? 0;
  if (current <= 1) {
    active.delete(identity);
    return;
  }
  active.set(identity, current - 1);
}

export function activeStreamCount(identity: number): number {
  return active.get(identity) ?? 0;
}
