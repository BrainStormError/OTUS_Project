import { SettingsScreen } from '@/components/features/movie-tracker/screens/auth-screens';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
      <SettingsScreen withIdentity />
    </div>
  );
}
