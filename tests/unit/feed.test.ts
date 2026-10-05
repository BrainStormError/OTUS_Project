import { describe, expect, it } from 'vitest';

import { toFeedEvent } from '@/components/features/movie-tracker/feed';
import type { FeedItem } from '@/modules/activity';

function item(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'event-1',
    actorId: 'actor-1',
    kind: 'film_rated',
    groupId: null,
    targetType: 'film',
    targetId: '155',
    payload: { title: 'Тёмный рыцарь', rating: 8.5, href: '/film/155' },
    createdAt: '2026-08-24T10:00:00.000Z',
    actorName: 'Мария',
    actorHandle: 'maria',
    groupName: null,
    ...overrides,
  };
}

describe('toFeedEvent', () => {
  it('maps a friend film rating to a friend event with the rating and cursor', () => {
    const event = toFeedEvent(item(), 'viewer');
    expect(event).toMatchObject({
      id: 'event-1',
      source: 'friend',
      sourceName: 'Мария',
      kind: 'film',
      title: 'Тёмный рыцарь',
      rating: 8.5,
      href: '/film/155',
    });
    expect(event.cursor.length).toBeGreaterThan(0);
  });

  it("maps the viewer's own activity to the you source", () => {
    const event = toFeedEvent(item({ actorId: 'viewer' }), 'viewer');
    expect(event.source).toBe('you');
  });

  it('maps a group rating to a group event carrying the group name', () => {
    const event = toFeedEvent(item({ groupId: 'g1', groupName: 'Киновечера' }), 'viewer');
    expect(event.source).toBe('group');
    expect(event.sourceName).toBe('Киновечера');
  });

  it('maps a friendship event without a rating', () => {
    const event = toFeedEvent(
      item({
        kind: 'friendship_accepted',
        targetType: 'user',
        targetId: 'actor-1',
        payload: {},
      }),
      'viewer',
    );
    expect(event.kind).toBe('friendship');
    expect(event.rating).toBeNull();
    expect(event.href).toBe('/u/maria');
  });

  it('maps a group join to a group event linking to the group', () => {
    const event = toFeedEvent(
      item({
        kind: 'group_joined',
        groupId: 'g1',
        groupName: 'Киновечера',
        targetType: 'group',
        targetId: 'g1',
        payload: {},
      }),
      'viewer',
    );
    expect(event.kind).toBe('group');
    expect(event.title).toBe('Киновечера');
    expect(event.href).toBe('/groups/g1');
  });
});
