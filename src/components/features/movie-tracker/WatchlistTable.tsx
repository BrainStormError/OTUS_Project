'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import type { WatchlistItem } from './types';

export function WatchlistTable({
  testId,
  items,
  onRate,
  onRemove,
}: {
  testId: string;
  items: WatchlistItem[];
  onRate: (item: WatchlistItem) => void;
  onRemove: (item: WatchlistItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table data-testid={testId} className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-3 font-medium">
              Название
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Год
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Добавлено
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                <Link
                  href={`/${item.movie.kind === 'series' ? 'series' : 'film'}/${item.movie.tmdbId}`}
                  prefetch={false}
                  className="rounded-md underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.movie.title}
                </Link>
              </th>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {item.movie.year ?? '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{item.addedAt}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onRate(item)}>
                    Оценить
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemove(item)}
                  >
                    Удалить
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
