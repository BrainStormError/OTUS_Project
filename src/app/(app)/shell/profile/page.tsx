'use client';

import { UserProfileScreen } from '@/components/features/movie-tracker/screens/auth-screens';
import { usePathSegment } from '@/components/features/movie-tracker/screens/use-path-segment';

export default function ProfileShellPage() {
  const handle = usePathSegment(1);

  return handle ? <UserProfileScreen handle={handle} /> : null;
}
