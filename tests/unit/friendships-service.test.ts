import { describe, expect, it, vi } from 'vitest';

const { listOutgoingMock } = vi.hoisted(() => ({
  listOutgoingMock: vi.fn(),
}));

vi.mock('@/modules/friendships/repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/friendships/repository')>()),
  listOutgoingRequests: listOutgoingMock,
}));

import { getOutgoingRequests } from '@/modules/friendships/service';

const actor = { id: 1, role: 'employee' as const };

describe('getOutgoingRequests', () => {
  it('returns the outgoing requests for the actor', async () => {
    const outgoing = [
      { id: 1, user: { id: 2, name: 'Мария', handle: 'maria' } },
    ];
    listOutgoingMock.mockResolvedValue(outgoing);

    const result = await getOutgoingRequests(actor);

    expect(result).toEqual({ ok: true, value: outgoing });
    expect(listOutgoingMock).toHaveBeenCalledWith(1);
  });

  it('returns an empty list when nothing is pending', async () => {
    listOutgoingMock.mockResolvedValue([]);

    const result = await getOutgoingRequests(actor);

    expect(result).toEqual({ ok: true, value: [] });
  });
});
