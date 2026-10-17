'use client';

import Link from 'next/link';

import { CatalogDetailScreen } from '@/components/features/movie-tracker/screens/catalog-screens';
import { usePathSegment } from '@/components/features/movie-tracker/screens/use-path-segment';

export default function SeriesShellPage() {
  const tmdbId = usePathSegment(1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/series"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Назад к поиску
      </Link>
      {tmdbId ? <CatalogDetailScreen kind="series" tmdbId={tmdbId} /> : null}
    </div>
  );
}
