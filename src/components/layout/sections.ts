export type SectionKey =
  | 'home'
  | 'films'
  | 'series'
  | 'friends'
  | 'groups'
  | 'me'
  | 'settings';

export type Section = {
  key: SectionKey;
  href: string;
  label: string;
  inTabBar: boolean;
};

export const sections: Section[] = [
  { key: 'home', href: '/', label: 'Главная', inTabBar: true },
  { key: 'films', href: '/films', label: 'Мои фильмы', inTabBar: true },
  { key: 'series', href: '/series', label: 'Мои сериалы', inTabBar: true },
  { key: 'friends', href: '/friends', label: 'Друзья', inTabBar: true },
  { key: 'groups', href: '/groups', label: 'Группы', inTabBar: true },
  { key: 'me', href: '/me', label: 'Профиль', inTabBar: true },
  { key: 'settings', href: '/settings', label: 'Настройки', inTabBar: false },
];

export const tabSections = sections.filter((section) => section.inTabBar);

export function isSectionActive(href: string, pathname: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
