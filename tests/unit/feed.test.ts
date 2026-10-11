import { describe, expect, it } from 'vitest';

import { toFeedEvent } from '@/components/features/movie-tracker/feed';
import type { FeedItem } from '@/modules/activity';

function item(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 1,
    actorId: 2,
    kind: 'film_rated',
    groupId: null,
    mediaId: 10,
    discussionId: null,
    createdAt: '2026-08-24T10:00:00.000Z',
    actorName: 'Мария',
    actorHandle: 'maria',
    groupName: null,
    title: 'Тёмный рыцарь',
    rating: 8.5,
    href: '/film/155',
    ...overrides,
  };
}

describe('toFeedEvent', () => {
  it('maps a friend film rating to a friend event with the rating and cursor', () => {
    const event = toFeedEvent(item(), 1);
    expect(event).toMatchObject({
      id: 1,
      source: 'friend',
      sourceName: 'Мария',
      kind: 'film',
      title: 'Тёмный рыцарь',
      rating: 8.5,
      href: '/film/155',
    });
    expect(event.cursor.length).toBeGreaterThan(0);
    expect(event.createdAt).toBe('2026-08-24T10:00:00.000Z');
  });

  it("maps the viewer's own activity to the you source", () => {
    const event = toFeedEvent(item({ actorId: 1 }), 1);
    expect(event.source).toBe('you');
  });

  it('maps a group rating to a group event carrying the group name', () => {
    const event = toFeedEvent(item({ groupId: 1, groupName: 'Киновечера' }), 1);
    expect(event.source).toBe('group');
    expect(event.sourceName).toBe('Киновечера');
  });

  it('maps a friendship event without a rating', () => {
    const event = toFeedEvent(
      item({
        kind: 'friendship_accepted',
        mediaId: null,
        title: 'Новая дружба',
        rating: null,
        href: '/u/maria',
      }),
      1,
    );
    expect(event.kind).toBe('friendship');
    expect(event.rating).toBeNull();
    expect(event.href).toBe('/u/maria');
  });

  it('maps a group join to a group event linking to the group', () => {
    const event = toFeedEvent(
      item({
        kind: 'group_joined',
        groupId: 1,
        groupName: 'Киновечера',
        mediaId: null,
        title: 'Киновечера',
        rating: null,
        href: '/groups/1',
      }),
      1,
    );
    expect(event.kind).toBe('group');
    expect(event.title).toBe('Киновечера');
    expect(event.href).toBe('/groups/1');
  });
});
