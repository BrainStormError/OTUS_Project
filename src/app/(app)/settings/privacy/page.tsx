import { SettingsView } from '@/components/features/movie-tracker/SettingsView';

export default function PrivacySettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Приватность</h1>
      <SettingsView />
    </div>
  );
}
