import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

import { AccountMenu } from './account-menu';

export function TopBar({ name, tag }: { name: string; tag: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur">
      <Link
        href="/"
        aria-label="Смотровик — на главную"
        className="absolute left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-md px-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Clapperboard aria-hidden="true" className="h-5 w-5 text-accent-foreground" />
        <span>Смотровик</span>
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <AccountMenu name={name} tag={tag} />
      </div>
    </header>
  );
}
