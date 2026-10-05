import { ProfileView } from '@/components/features/movie-tracker/ProfileView';
import { currentUser } from '@/components/features/movie-tracker/data';

export default function MyProfilePage() {
  return <ProfileView user={currentUser} isOwn />;
}
