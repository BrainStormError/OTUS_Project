'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/components/ui/utils';

import { useIdentityDisplay } from './preferences';

export function AccountMenu({ name, tag }: { name: string; tag: string }) {
  const [identity] = useIdentityDisplay();
  const showName = identity !== 'tag';
  const showTag = identity !== 'name';

  return (
    <details className="relative min-w-0">
      <summary
        aria-label="Меню аккаунта"
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
      >
        <span className="flex min-w-0 flex-col items-start leading-tight">
          {showName ? (
            <span className="max-w-40 truncate font-medium text-foreground">{name}</span>
          ) : null}
          {showTag ? (
            <span
              className={cn(
                'max-w-40 truncate',
                identity === 'both' ? 'text-[0.7rem]' : 'text-sm',
              )}
            >
              @{tag}
            </span>
          ) : null}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </summary>
      <div className="animate-slide absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground elevation-raised">
        <Link
          href="/me"
          className="block min-h-11 rounded-sm px-3 py-3 text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Профиль
        </Link>
        <Link
          href="/settings"
          className="block min-h-11 rounded-sm px-3 py-3 text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Настройки
        </Link>
        <button
          type="button"
          onClick={() => {
            void signOut({ callbackUrl: '/login' });
          }}
          className="block w-full min-h-11 rounded-sm px-3 py-3 text-left text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Выйти
        </button>
      </div>
    </details>
  );
}
