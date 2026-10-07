import { notFound } from 'next/navigation';

import { toPublicUserFromProfile } from '@/components/features/movie-tracker/adapters';
import { ProfileView } from '@/components/features/movie-tracker/ProfileView';
import { getActor } from '@/modules/auth/session';
import { getProfileByHandle } from '@/modules/profiles';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const viewer = await getActor();
  const result = await getProfileByHandle(viewer, handle);
  if (!result.ok) {
    notFound();
  }

  return <ProfileView user={toPublicUserFromProfile(result.value)} isOwn={result.value.isOwn} />;
}
