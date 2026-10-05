import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';

import type { Group } from './types';

export function GroupCard({
  group,
  className,
  onJoin,
}: {
  group: Group;
  className?: string;
  onJoin?: () => void;
}) {
  return (
    <Card
      data-testid="group-card"
      className={cn('p-0 transition-hover hover:shadow-md', className)}
    >
      <Link
        href={`/groups/${group.id}`}
        className="flex flex-col gap-2 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="text-base font-semibold">{group.name}</span>
        {group.description ? (
          <span className="text-sm text-muted-foreground">{group.description}</span>
        ) : null}
        {group.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label="Теги группы">
            {group.tags.map((tag) => (
              <li key={tag}>
                <Badge>{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </Link>
      {onJoin ? (
        <div className="px-4 pb-4">
          <Button
            type="button"
            size="sm"
            onClick={onJoin}
            aria-label={`Вступить в группу ${group.name}`}
          >
            Вступить
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
