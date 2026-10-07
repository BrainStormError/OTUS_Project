import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/core/result';

const { getActorMock, updatePrivacyMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  updatePrivacyMock: vi.fn(),
}));

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/auth', async () => {
  const schema = await vi.importActual<typeof import('@/modules/auth/schema')>(
    '@/modules/auth/schema',
  );
  return { privacyInput: schema.privacyInput, updatePrivacy: updatePrivacyMock };
});

import { PATCH } from '@/app/api/me/privacy/route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/me/privacy', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  });
}

describe('privacy mutation route', () => {
  it('returns 401 without a session', async () => {
    getActorMock.mockResolvedValue(null);
    const response = await PATCH(request({ profileHidden: true }));
    expect(response.status).toBe(401);
  });

  it('returns the updated flags with a session', async () => {
    getActorMock.mockResolvedValue({ id: 'u1', role: 'employee' });
    updatePrivacyMock.mockResolvedValue(ok({ profileHidden: true, statsHidden: false }));
    const response = await PATCH(request({ profileHidden: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profileHidden: true, statsHidden: false });
  });
});
