import { GroupsScreen } from '@/components/features/movie-tracker/screens/groups-screens';

export default function GroupsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Группы</h1>
      <GroupsScreen />
    </div>
  );
}
