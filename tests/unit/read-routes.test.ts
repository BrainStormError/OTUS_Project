import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '@/core/result';

const { getActorMock, getOwnProfileMock, getProfileByHandleMock, getPrivacyMock } = vi.hoisted(
  () => ({
    getActorMock: vi.fn(),
    getOwnProfileMock: vi.fn(),
    getProfileByHandleMock: vi.fn(),
    getPrivacyMock: vi.fn(),
  }),
);

vi.mock('@/modules/auth/session', () => ({ getActor: getActorMock }));

vi.mock('@/modules/auth', async () => {
  const schema = await vi.importActual<typeof import('@/modules/auth/schema')>(
    '@/modules/auth/schema',
  );
  return {
    identityUpdateInput: schema.identityUpdateInput,
    privacyInput: schema.privacyInput,
    updateIdentity: vi.fn(),
    updatePrivacy: vi.fn(),
    getPrivacy: getPrivacyMock,
  };
});

vi.mock('@/modules/profiles', () => ({
  getOwnProfile: getOwnProfileMock,
  getProfileByHandle: getProfileByHandleMock,
}));

import { GET as identityRead } from '@/app/api/me/identity/route';
import { GET as privacyRead } from '@/app/api/me/privacy/route';
import { GET as profileRead } from '@/app/api/me/profile/route';
import { GET as statsRead } from '@/app/api/me/stats/route';
import { GET as publicProfileRead } from '@/app/api/profiles/[handle]/route';

const actor = { id: 1, role: 'employee' as const, name: 'Алексей', handle: 'me' };

const stats = {
  films: 1,
  series: 1,
  genres: [{ genre: 'драма', count: 2 }],
  years: [{ year: 2010, count: 1 }],
};

const profile = {
  identity: {
    id: 1,
    name: 'Алексей',
    handle: 'me',
    profileHidden: false,
    statsHidden: false,
  },
  isOwn: true,
  profileRestricted: false,
  statsRestricted: false,
  relationship: null,
  stats,
  recent: [],
};

function get(path: string): Request {
  return new Request(`http://localhost${path}`, {
    headers: { 'sec-fetch-site': 'same-origin' },
  });
}

describe('read routes', () => {
  it('refuses reads without a session with 401 before anything else', async () => {
    getActorMock.mockResolvedValue(null);
    for (const route of [identityRead, privacyRead, profileRead, statsRead, publicProfileRead]) {
      const response = await route(get('/api/me/stats'));
      expect(response.status).toBe(401);
    }
  });

  it('returns the signed-in identity and refuses unexpected parameters', async () => {
    getActorMock.mockResolvedValue(actor);

    const response = await identityRead(get('/api/me/identity'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 1, name: 'Алексей', handle: 'me' });
    expect(response.headers.get('x-request-id')).toBeTruthy();

    const malformed = await identityRead(get('/api/me/identity?role=admin'));
    expect(malformed.status).toBe(400);
  });

  it('returns the owner statistics', async () => {
    getActorMock.mockResolvedValue(actor);
    getOwnProfileMock.mockResolvedValue(ok(profile));

    const response = await statsRead(get('/api/me/stats'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(stats);

    const malformed = await statsRead(get('/api/me/stats?window=all'));
    expect(malformed.status).toBe(400);
  });

  it('returns the owner profile and privacy flags', async () => {
    getActorMock.mockResolvedValue(actor);
    getOwnProfileMock.mockResolvedValue(ok(profile));
    getPrivacyMock.mockResolvedValue(ok({ profileHidden: true, statsHidden: false }));

    const own = await profileRead(get('/api/me/profile'));
    expect(own.status).toBe(200);
    expect(await own.json()).toMatchObject({ isOwn: true, stats });

    const privacy = await privacyRead(get('/api/me/privacy'));
    expect(privacy.status).toBe(200);
    expect(await privacy.json()).toEqual({ profileHidden: true, statsHidden: false });
  });

  it('returns a profile by handle and a typed refusal for an unknown one', async () => {
    getActorMock.mockResolvedValue(actor);
    getProfileByHandleMock.mockResolvedValue(ok({ ...profile, isOwn: false }));

    const found = await publicProfileRead(get('/api/profiles/maria'));
    expect(found.status).toBe(200);
    expect(getProfileByHandleMock).toHaveBeenCalledWith(actor, 'maria');

    getProfileByHandleMock.mockResolvedValue(err('NOT_FOUND', 'Пользователь не найден'));
    const missing = await publicProfileRead(get('/api/profiles/nobody'));
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});
