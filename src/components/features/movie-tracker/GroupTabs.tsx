import Link from 'next/link';

import { cn } from '@/components/ui/utils';

export const GROUP_TABS = [
  { id: 'discussions', label: 'Обсуждения' },
  { id: 'ratings', label: 'Оценки' },
  { id: 'activity', label: 'Активность' },
  { id: 'members', label: 'Участники' },
  { id: 'stats', label: 'Статистика' },
] as const;

export type GroupTabId = (typeof GROUP_TABS)[number]['id'];

export function isGroupTabId(value: string | undefined): value is GroupTabId {
  return GROUP_TABS.some((tab) => tab.id === value);
}

export function GroupTabs({
  groupId,
  active,
}: {
  groupId: number;
  active: GroupTabId;
}) {
  return (
    <nav aria-label="Разделы группы">
      <ul role="tablist" className="-mb-px flex flex-wrap gap-1 border-b border-border">
        {GROUP_TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <li key={tab.id} role="presentation">
              <Link
                href={`/groups/${groupId}?tab=${tab.id}`}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm transition-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  selected
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
