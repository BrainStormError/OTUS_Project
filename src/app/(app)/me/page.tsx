import { redirect } from 'next/navigation';

import { toPublicUserFromProfile } from '@/components/features/movie-tracker/adapters';
import { ProfileView } from '@/components/features/movie-tracker/ProfileView';
import { getActor } from '@/modules/auth/session';
import { getOwnProfile } from '@/modules/profiles';

export const dynamic = 'force-dynamic';

export default async function MyProfilePage() {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const result = await getOwnProfile(actor);
  if (!result.ok) {
    redirect('/login');
  }

  return <ProfileView user={toPublicUserFromProfile(result.value)} isOwn />;
}
