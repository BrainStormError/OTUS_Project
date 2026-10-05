import { SettingsView } from '@/components/features/movie-tracker/SettingsView';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
      <SettingsView />
    </div>
  );
}
