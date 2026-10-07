import { SettingsView } from '@/components/features/movie-tracker/SettingsView';
import { getPrivacy } from '@/modules/auth';
import { getActor } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const actor = await getActor();
  const privacy = actor ? await getPrivacy(actor) : null;
  const flags = privacy?.ok
    ? privacy.value
    : { profileHidden: false, statsHidden: false };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
      <SettingsView
        initialProfileHidden={flags.profileHidden}
        initialStatsHidden={flags.statsHidden}
      />
    </div>
  );
}
