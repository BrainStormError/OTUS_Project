import Link from 'next/link';

import { OwnStatsScreen } from '@/components/features/movie-tracker/screens/auth-screens';
import { Button } from '@/components/ui/button';

export default function MyStatsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Статистика</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/me">К профилю</Link>
        </Button>
      </header>
      <OwnStatsScreen />
    </div>
  );
}
