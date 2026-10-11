import { describe, expect, it } from 'vitest';

import {
  acquireStreamSlot,
  activeStreamCount,
  MAX_STREAM_CONNECTIONS_PER_IDENTITY,
  releaseStreamSlot,
} from '@/core/http/stream-guard';

describe('stream guard', () => {
  it('refuses a slot past the per-identity cap', () => {
    const identity = 1_000_001;
    for (let i = 0; i < MAX_STREAM_CONNECTIONS_PER_IDENTITY; i += 1) {
      expect(acquireStreamSlot(identity)).toBe(true);
    }
    expect(acquireStreamSlot(identity)).toBe(false);
  });

  it('frees the slot on release, including down to zero', () => {
    const identity = 1_000_002;
    expect(acquireStreamSlot(identity)).toBe(true);
    expect(acquireStreamSlot(identity)).toBe(true);
    releaseStreamSlot(identity);
    expect(activeStreamCount(identity)).toBe(1);
    releaseStreamSlot(identity);
    expect(activeStreamCount(identity)).toBe(0);
  });

  it('keeps counters separate per identity', () => {
    const first = 1_000_003;
    const second = 1_000_004;
    for (let i = 0; i < MAX_STREAM_CONNECTIONS_PER_IDENTITY; i += 1) {
      acquireStreamSlot(first);
    }
    expect(acquireStreamSlot(first)).toBe(false);
    expect(acquireStreamSlot(second)).toBe(true);
  });

  it('treats a release without an active slot as a no-op', () => {
    const identity = 1_000_005;
    releaseStreamSlot(identity);
    expect(activeStreamCount(identity)).toBe(0);
  });
});
