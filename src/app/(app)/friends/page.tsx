import { FriendsScreen } from '@/components/features/movie-tracker/screens/friends-screens';

export default function FriendsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Друзья</h1>
      <FriendsScreen />
    </div>
  );
}
