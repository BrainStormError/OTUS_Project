import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Movie Tracker</h1>
      <p className="max-w-prose text-center text-muted-foreground">
        Отмечайте просмотренные фильмы в соло или вместе с друзьями. Продолжите в
        приложении, чтобы открыть справочник.
      </p>
      <Button asChild>
        <Link href="/directory">Open directory</Link>
      </Button>
    </main>
  );
}
