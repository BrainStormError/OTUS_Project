'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

import { NavLinks } from './nav-links';
import { useRailCollapsed } from './preferences';

export function SidebarRail() {
  const [collapsed, setCollapsed] = useRailCollapsed();

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-border bg-brand text-brand-foreground md:block',
        collapsed ? 'w-24' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border',
          collapsed ? 'justify-center' : 'justify-end px-4',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          aria-pressed={collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav aria-label="Основная навигация" className={collapsed ? 'p-2' : 'p-3'}>
        <NavLinks variant="rail" ariaLabel="Основная навигация" collapsed={collapsed} />
      </nav>
    </aside>
  );
}
