import Link from 'next/link';

import { ThemeSwitcher } from '@/components/layout/theme-switcher';
import type { Actor } from '@/core/auth/policy';

export function Header({ actor }: { actor: Actor }) {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <nav className="flex items-center gap-4" aria-label="Основная навигация">
          <Link href="/directory" className="font-semibold">
            Справочник
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {actor.email ?? actor.id}
          </span>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
