import type { FeedItem } from '@/modules/activity';

// Kept in sync with the activity module cursor format; duplicated here so the
// client bundle never imports the server-only activity module graph.
function encodeCursor(createdAt: string, id: number | string): string {
  const base64 = btoa(`${createdAt}|${id}`);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export type FeedSource = 'friend' | 'group' | 'you';
export type FeedKind = 'film' | 'series' | 'friendship' | 'group';

export type FeedEvent = {
  id: number;
  cursor: string;
  source: FeedSource;
  sourceName: string;
  kind: FeedKind;
  title: string;
  rating: number | null;
  createdAt: string;
  href: string;
  action: string;
};

const FALLBACK_NAME = 'Пользователь';

export function toFeedEvent(item: FeedItem, viewerId: number): FeedEvent {
  const cursor = encodeCursor(item.createdAt, item.id);
  const actorName = item.actorName ?? FALLBACK_NAME;
  const groupName = item.groupName ?? '';
  const createdAt = item.createdAt;

  switch (item.kind) {
    case 'film_rated':
    case 'series_rated': {
      const isFilm = item.kind === 'film_rated';
      return {
        id: item.id,
        cursor,
        source: item.groupId ? 'group' : item.actorId === viewerId ? 'you' : 'friend',
        sourceName: item.groupId ? groupName || FALLBACK_NAME : actorName,
        kind: isFilm ? 'film' : 'series',
        title: item.title ?? '',
        rating: item.rating,
        createdAt,
        href: item.href ?? '/',
        action: item.groupId ? 'оценил(а) в группе' : 'оценил(а)',
      };
    }
    case 'friendship_accepted':
      return {
        id: item.id,
        cursor,
        source: item.actorId === viewerId ? 'you' : 'friend',
        sourceName: actorName,
        kind: 'friendship',
        title: 'Новая дружба',
        rating: null,
        createdAt,
        href: item.href ?? '/',
        action: 'теперь в друзьях',
      };
    case 'group_joined':
      return {
        id: item.id,
        cursor,
        source: item.groupId ? 'group' : item.actorId === viewerId ? 'you' : 'friend',
        sourceName: actorName,
        kind: 'group',
        title: item.title ?? (groupName || 'Группа'),
        rating: null,
        createdAt,
        href: item.href ?? '/',
        action: 'вступил(а) в группу',
      };
    default:
      return {
        id: item.id,
        cursor,
        source: item.groupId ? 'group' : item.actorId === viewerId ? 'you' : 'friend',
        sourceName: item.groupId ? groupName || FALLBACK_NAME : actorName,
        kind: 'film',
        title: item.title ?? 'Активность',
        rating: null,
        createdAt,
        href: item.href ?? '/',
        action: 'активность',
      };
  }
}
