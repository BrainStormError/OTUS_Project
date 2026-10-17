import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

import { AccountMenu } from './account-menu';

export function TopBar({ name, tag }: { name: string | null; tag: string | null }) {
  return (
    <header className="sticky top-0 z-10 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
      <div aria-hidden="true" />
      <Link
        href="/"
        prefetch={false}
        aria-label="Смотровик — на главную"
        className="flex min-h-11 items-center justify-center gap-2 rounded-md px-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Clapperboard aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-mark" />
        <span className="truncate">Смотровик</span>
      </Link>
      <div className="flex min-w-0 items-center justify-end gap-3">
        <AccountMenu name={name} tag={tag} />
      </div>
    </header>
  );
}
