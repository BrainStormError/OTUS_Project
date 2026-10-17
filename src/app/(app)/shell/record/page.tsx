'use client';

import { RecordScreen } from '@/components/features/movie-tracker/screens/catalog-screens';
import { usePathSegment } from '@/components/features/movie-tracker/screens/use-path-segment';

export default function RecordShellPage() {
  const id = usePathSegment(1);

  return id ? <RecordScreen id={id} /> : null;
}
