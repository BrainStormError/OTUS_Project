'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Film,
  Heart,
  Home,
  Settings,
  Tv,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/components/ui/utils';

import { isSectionActive, sections, tabSections, type SectionKey } from './sections';

const ICONS: Record<SectionKey, LucideIcon> = {
  home: Home,
  films: Film,
  series: Tv,
  friends: Heart,
  groups: UsersRound,
  me: UserRound,
  settings: Settings,
};

export function NavLinks({
  variant,
  ariaLabel,
  collapsed = false,
}: {
  variant: 'rail' | 'tabs';
  ariaLabel: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const items = variant === 'rail' ? sections : tabSections;
  const iconOnly = variant === 'rail' && collapsed;

  return (
    <ul
      aria-label={ariaLabel}
      className={cn(variant === 'rail' ? 'flex flex-col gap-1' : 'grid grid-cols-6 gap-1 p-1')}
    >
      {items.map((section) => {
        const active = isSectionActive(section.href, pathname);
        const Icon = ICONS[section.key];
        return (
          <li key={section.key} className={variant === 'tabs' ? 'flex' : undefined}>
            <Link
              href={section.href}
              prefetch
              aria-current={active ? 'page' : undefined}
              aria-label={iconOnly ? section.label : undefined}
              title={iconOnly ? section.label : undefined}
              className={cn(
                'transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                variant === 'rail'
                  ? cn(
                      'flex min-h-11 items-center rounded-md text-sm font-medium hover:bg-shell-active/60',
                      iconOnly ? 'justify-center px-0' : 'gap-3 px-3',
                    )
                  : 'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-md text-xs',
                active ? 'bg-shell-active text-shell-active-foreground' : 'text-shell-foreground',
              )}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {iconOnly ? null : (
                <span className={variant === 'rail' ? undefined : 'text-center leading-none'}>
                  {section.label}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
