import { NavLinks } from './nav-links';

export function MobileTabBar() {
  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-shell text-shell-foreground pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <NavLinks variant="tabs" ariaLabel="Основная навигация" />
    </nav>
  );
}
