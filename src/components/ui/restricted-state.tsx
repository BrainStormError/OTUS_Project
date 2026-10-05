import { Lock, ShieldOff, EyeOff } from 'lucide-react';

import { Button } from './button';
import { cn } from './utils';

export type RestrictedKind = 'profile' | 'statistics' | 'no-permission';

const COPY: Record<RestrictedKind, { title: string; description: string; icon: typeof Lock }> = {
  profile: {
    title: 'Профиль скрыт',
    description: 'Владелец ограничил доступ к своему профилю.',
    icon: EyeOff,
  },
  statistics: {
    title: 'Статистика скрыта',
    description: 'Владелец не открыл свою статистику для просмотра.',
    icon: Lock,
  },
  'no-permission': {
    title: 'Нет доступа',
    description: 'У вас нет прав для просмотра этого раздела.',
    icon: ShieldOff,
  },
};

export function RestrictedState({
  kind,
  action,
  className,
}: {
  kind: RestrictedKind;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  const { title, description, icon: Icon } = COPY[kind];
  return (
    <div
      role="status"
      data-testid={`restricted-${kind}`}
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
      <p className="text-base font-medium">{title}</p>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      {action?.href ? (
        <Button asChild variant="outline" size="sm">
          <a href={action.href}>{action.label}</a>
        </Button>
      ) : action ? (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
