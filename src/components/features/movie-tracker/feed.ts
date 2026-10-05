import type { FeedItem } from '@/modules/activity';

// Kept in sync with the activity module cursor format; duplicated here so the
// client bundle never imports the server-only activity module graph.
function encodeCursor(createdAt: string, id: string): string {
  const base64 = btoa(`${createdAt}|${id}`);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export type FeedSource = 'friend' | 'group' | 'you';
export type FeedKind = 'film' | 'series' | 'friendship' | 'group';

export type FeedEvent = {
  id: string;
  cursor: string;
  source: FeedSource;
  sourceName: string;
  kind: FeedKind;
  title: string;
  rating: number | null;
  watchedAt: string;
  href: string;
  action: string;
};

const FALLBACK_NAME = 'Пользователь';

export function toFeedEvent(item: FeedItem, viewerId: string): FeedEvent {
  const cursor = encodeCursor(item.createdAt, item.id);
  const actorName = item.actorName ?? FALLBACK_NAME;
  const groupName = item.groupName ?? '';
  const watchedAt = item.createdAt.slice(0, 10);

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
        title: item.payload.title ?? '',
        rating: typeof item.payload.rating === 'number' ? item.payload.rating : null,
        watchedAt,
        href:
          item.payload.href ?? (isFilm ? `/film/${item.targetId}` : '/series'),
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
        watchedAt,
        href: item.actorHandle ? `/u/${item.actorHandle}` : '/',
        action: 'теперь в друзьях',
      };
    case 'group_joined':
      return {
        id: item.id,
        cursor,
        source: item.groupId ? 'group' : item.actorId === viewerId ? 'you' : 'friend',
        sourceName: actorName,
        kind: 'group',
        title: groupName || 'Группа',
        rating: null,
        watchedAt,
        href: item.groupId ? `/groups/${item.groupId}` : '/',
        action: 'вступил(а) в группу',
      };
    default:
      return {
        id: item.id,
        cursor,
        source: item.groupId ? 'group' : item.actorId === viewerId ? 'you' : 'friend',
        sourceName: item.groupId ? groupName || FALLBACK_NAME : actorName,
        kind: 'film',
        title: item.payload.title ?? 'Активность',
        rating: null,
        watchedAt,
        href: item.payload.href ?? '/',
        action: 'активность',
      };
  }
}
