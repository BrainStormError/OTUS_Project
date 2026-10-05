import { notFound } from 'next/navigation';

import { ProfileView } from '@/components/features/movie-tracker/ProfileView';
import { findUser } from '@/components/features/movie-tracker/data';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const user = findUser(handle);
  if (!user) {
    notFound();
  }

  return <ProfileView user={user} isOwn={handle === 'me'} />;
}
