import { FriendRequestsScreen } from '@/components/features/movie-tracker/screens/friends-screens';

export default function FriendRequestsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Заявки в друзья</h1>
      <FriendRequestsScreen />
    </div>
  );
}
