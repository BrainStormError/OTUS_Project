import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Actor } from '@/core/auth/policy';
import { closePool, query } from '@/core/db/pool';
import { insertUser, updatePrivacy } from '@/modules/auth/repository';
import {
  createFriendRequest,
  declineFriendship,
  getFriends,
  getOutgoingRequests,
  removeFriend,
  searchUsers,
  withdrawFriendRequest,
} from '@/modules/friendships';

async function insertUserNamed(name: string) {
  return insertUser({
    email: `${randomUUID()}@example.com`,
    name,
    role: 'employee',
  });
}

async function actorOf(name: string): Promise<Actor> {
  const rows = await query<{ id: number; role: number }>(
    'SELECT id, role FROM users WHERE name = $1',
    [name],
  );
  const row = rows[0];
  if (!row) {
    throw new Error(`actor ${name} not found`);
  }
  return { id: row.id, role: row.role === 1 ? 'admin' : 'employee' };
}

async function acceptFriendshipRow(friendshipId: number) {
  await query('UPDATE friendships SET status = 1 WHERE id = $1', [friendshipId]);
}

let alice: Actor;
let bob: Actor;
let carol: Actor;
let dave: Actor;
let eve: Actor;

beforeAll(async () => {
  await insertUserNamed('Алиса Поисковая');
  await insertUserNamed('Боб Друг');
  await insertUserNamed('Каролина Тайна');
  await insertUserNamed('Дэйв Смирнов');
  await insertUserNamed('Ева Направленная');

  alice = await actorOf('Алиса Поисковая');
  bob = await actorOf('Боб Друг');
  carol = await actorOf('Каролина Тайна');
  dave = await actorOf('Дэйв Смирнов');
  eve = await actorOf('Ева Направленная');

  await query('UPDATE users SET handle = $1 WHERE id = $2', ['bobby', bob.id]);
  await updatePrivacy(carol.id, { profileHidden: true });

  await query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 1)`,
    [bob.id, alice.id],
  );
});

afterAll(async () => {
  await closePool();
});

async function search(actor: Actor, q: string) {
  const result = await searchUsers(actor, { q });
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.value;
}

describe('searchUsers', () => {
  it('lists matching accepted friends with the friend status', async () => {
    const results = await search(alice, 'Боб');
    expect(results.map((item) => item.id)).toEqual([bob.id]);
    expect(results[0]?.relationship).toBe('friend');
    expect(results[0]?.handle).toBe('bobby');
  });

  it('falls back to all non-hidden profiles when no friend matches', async () => {
    const results = await search(alice, 'Дэйв');
    expect(results.map((item) => item.id)).toEqual([dave.id]);
    expect(results[0]?.relationship).toBe('none');
  });

  it('never returns the searcher own profile', async () => {
    const results = await search(alice, 'Алиса');
    expect(results.map((item) => item.id)).not.toContain(alice.id);
    expect(results).toHaveLength(0);
  });

  it('excludes hidden profiles that are not friends', async () => {
    const results = await search(alice, 'Каролина');
    expect(results).toHaveLength(0);
  });

  it('matches by handle', async () => {
    const results = await search(alice, 'bobby');
    expect(results.map((item) => item.id)).toEqual([bob.id]);
  });

  it('annotates pending relationships in both directions', async () => {
    await createFriendRequest(alice, { addresseeId: dave.id });
    await createFriendRequest(eve, { addresseeId: alice.id });

    const outgoing = await search(alice, 'Дэйв');
    expect(outgoing[0]?.relationship).toBe('pending_out');

    const incoming = await search(alice, 'Ева');
    expect(incoming[0]?.relationship).toBe('pending_in');
  });
});

describe('createFriendRequest', () => {
  it('persists a pending request', async () => {
    const requester = await insertUserNamed('Женя Создаёт');
    const addressee = await insertUserNamed('Захар Получает');
    const actor = { id: requester.id, role: 'employee' as const };

    const result = await createFriendRequest(actor, { addresseeId: addressee.id });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('pending');
    expect(result.value.requesterId).toBe(requester.id);
    expect(result.value.addresseeId).toBe(addressee.id);
  });

  it('rejects a duplicate pending request in either direction', async () => {
    const result = await createFriendRequest(alice, { addresseeId: dave.id });
    expect(result).toMatchObject({ ok: false, code: 'CONFLICT' });

    const reverse = await createFriendRequest(dave, { addresseeId: alice.id });
    expect(reverse).toMatchObject({ ok: false, code: 'CONFLICT' });
  });

  it('rejects a request to an accepted friend', async () => {
    const result = await createFriendRequest(alice, { addresseeId: bob.id });
    expect(result).toMatchObject({ ok: false, code: 'CONFLICT' });
  });

  it('rejects a self request', async () => {
    const result = await createFriendRequest(alice, { addresseeId: alice.id });
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('rejects a request to an unknown user', async () => {
    const result = await createFriendRequest(alice, { addresseeId: 9_999_999_999 });
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });

  it('reuses the pair row when re-requesting after a decline', async () => {
    const requester = await insertUserNamed('Игорь Повторный');
    const addressee = await insertUserNamed('Лева Отказавший');
    const requesterActor = { id: requester.id, role: 'employee' as const };
    const addresseeActor = { id: addressee.id, role: 'employee' as const };

    const first = await createFriendRequest(requesterActor, { addresseeId: addressee.id });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const declined = await declineFriendship(addresseeActor, { friendshipId: first.value.id });
    expect(declined.ok).toBe(true);

    const second = await createFriendRequest(requesterActor, { addresseeId: addressee.id });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.id).toBe(first.value.id);
    expect(second.value.status).toBe('pending');

    const blocked = await createFriendRequest(addresseeActor, { addresseeId: requester.id });
    expect(blocked).toMatchObject({ ok: false, code: 'CONFLICT' });

    const secondDecline = await declineFriendship(addresseeActor, {
      friendshipId: first.value.id,
    });
    expect(secondDecline.ok).toBe(true);

    const reversed = await createFriendRequest(addresseeActor, { addresseeId: requester.id });
    expect(reversed.ok).toBe(true);
    if (!reversed.ok) return;
    expect(reversed.value.id).toBe(first.value.id);
    expect(reversed.value.requesterId).toBe(addressee.id);
    expect(reversed.value.status).toBe('pending');
  });
});

describe('getFriends', () => {
  it('returns each friend with the friendship id', async () => {
    const owner = await insertUserNamed('Фёдор Список');
    const friend = await insertUserNamed('Фаина Друг');
    const actor = { id: owner.id, role: 'employee' as const };
    const friendActor = { id: friend.id, role: 'employee' as const };

    const created = await createFriendRequest(actor, { addresseeId: friend.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await acceptFriendshipRow(created.value.id);

    const result = await getFriends(actor);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([
      { friendshipId: created.value.id, user: { id: friend.id, name: friend.name, handle: friend.handle } },
    ]);
    expect(friendActor.id).toBe(friend.id);
  });
});

describe('removeFriend', () => {
  it('deletes an accepted friendship for both parties', async () => {
    const owner = await insertUserNamed('Гриша Расфренд');
    const friend = await insertUserNamed('Галя Расфренд');
    const ownerActor = { id: owner.id, role: 'employee' as const };
    const friendActor = { id: friend.id, role: 'employee' as const };

    const created = await createFriendRequest(ownerActor, { addresseeId: friend.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await acceptFriendshipRow(created.value.id);

    const removed = await removeFriend(ownerActor, { friendshipId: created.value.id });
    expect(removed.ok).toBe(true);

    const rows = await query('SELECT id FROM friendships WHERE id = $1', [created.value.id]);
    expect(rows).toHaveLength(0);

    const ownerFriends = await getFriends(ownerActor);
    expect(ownerFriends.ok && ownerFriends.value).toHaveLength(0);
    const friendFriends = await getFriends(friendActor);
    expect(friendFriends.ok && friendFriends.value).toHaveLength(0);
  });

  it('rejects a non-party with a permission error and keeps the friendship', async () => {
    const owner = await insertUserNamed('Илья Расфренд');
    const friend = await insertUserNamed('Инга Расфренд');
    const stranger = await insertUserNamed('Игнат Чужой');
    const ownerActor = { id: owner.id, role: 'employee' as const };
    const strangerActor = { id: stranger.id, role: 'employee' as const };

    const created = await createFriendRequest(ownerActor, { addresseeId: friend.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await acceptFriendshipRow(created.value.id);

    const removed = await removeFriend(strangerActor, { friendshipId: created.value.id });
    expect(removed).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const rows = await query('SELECT id FROM friendships WHERE id = $1', [created.value.id]);
    expect(rows).toHaveLength(1);
  });

  it('does not remove pending friendships and reports unknown ids', async () => {
    const owner = await insertUserNamed('Ким Расфренд');
    const friend = await insertUserNamed('Кира Расфренд');
    const ownerActor = { id: owner.id, role: 'employee' as const };

    const created = await createFriendRequest(ownerActor, { addresseeId: friend.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const pending = await removeFriend(ownerActor, { friendshipId: created.value.id });
    expect(pending).toMatchObject({ ok: false, code: 'CONFLICT' });

    const rows = await query('SELECT id FROM friendships WHERE id = $1', [created.value.id]);
    expect(rows).toHaveLength(1);

    const missing = await removeFriend(ownerActor, { friendshipId: 9_999_999_999 });
    expect(missing).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });
});

describe('withdrawFriendRequest', () => {
  it('removes a pending outgoing request', async () => {
    const requester = await insertUserNamed('Мила Отзывает');
    const addressee = await insertUserNamed('Никита Ждёт');
    const actor = { id: requester.id, role: 'employee' as const };

    const created = await createFriendRequest(actor, { addresseeId: addressee.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const outgoing = await getOutgoingRequests(actor);
    expect(outgoing.ok && outgoing.value.some((item) => item.id === created.value.id)).toBe(true);

    const withdrawn = await withdrawFriendRequest(actor, { friendshipId: created.value.id });
    expect(withdrawn.ok).toBe(true);

    const rows = await query('SELECT id FROM friendships WHERE id = $1', [created.value.id]);
    expect(rows).toHaveLength(0);

    const emptied = await getOutgoingRequests(actor);
    expect(emptied.ok && emptied.value).toHaveLength(0);
  });

  it('does not delete accepted or declined requests', async () => {
    const requester = await insertUserNamed('Олег Принятый');
    const addressee = await insertUserNamed('Павел Отклонённый');
    const actor = { id: requester.id, role: 'employee' as const };

    const created = await createFriendRequest(actor, { addresseeId: addressee.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await acceptFriendshipRow(created.value.id);
    const accepted = await withdrawFriendRequest(actor, { friendshipId: created.value.id });
    expect(accepted).toMatchObject({ ok: false, code: 'CONFLICT' });

    await query('UPDATE friendships SET status = 2 WHERE id = $1', [created.value.id]);
    const declined = await withdrawFriendRequest(actor, { friendshipId: created.value.id });
    expect(declined).toMatchObject({ ok: false, code: 'CONFLICT' });

    const rows = await query('SELECT id FROM friendships WHERE id = $1', [created.value.id]);
    expect(rows).toHaveLength(1);
  });

  it('forbids withdrawing someone else request and unknown ids', async () => {
    const requester = await insertUserNamed('Рита Отправитель');
    const addressee = await insertUserNamed('Стас Получатель');
    const stranger = await insertUserNamed('Тарас Сторонний');
    const actor = { id: requester.id, role: 'employee' as const };
    const strangerActor = { id: stranger.id, role: 'employee' as const };

    const created = await createFriendRequest(actor, { addresseeId: addressee.id });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const foreign = await withdrawFriendRequest(strangerActor, {
      friendshipId: created.value.id,
    });
    expect(foreign).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const addresseeActor = { id: addressee.id, role: 'employee' as const };
    const asAddressee = await withdrawFriendRequest(addresseeActor, {
      friendshipId: created.value.id,
    });
    expect(asAddressee).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    const missing = await withdrawFriendRequest(actor, { friendshipId: 9_999_999_999 });
    expect(missing).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });
});
