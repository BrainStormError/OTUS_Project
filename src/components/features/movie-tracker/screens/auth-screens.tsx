'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useShellIdentity } from '@/components/layout/shell-identity';
import type { ProfileRead, ProfileStats } from '@/modules/profiles';

import { toPublicUserFromProfile } from '../adapters';
import { ProfileView } from '../ProfileView';
import { useRead } from '../read-store';
import { SettingsView } from '../SettingsView';
import { StatisticsView } from '../StatisticsView';

type PrivacyFlags = { profileHidden: boolean; statsHidden: boolean };

export function SettingsScreen({ withIdentity = false }: { withIdentity?: boolean }) {
  const identity = useShellIdentity();
  const state = useRead<PrivacyFlags>('/api/me/privacy');

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить настройки." retry={state.retry} />
    );
  }

  const flags = state.data;
  return (
    <SettingsView
      initialProfileHidden={flags.profileHidden}
      initialStatsHidden={flags.statsHidden}
      name={withIdentity ? identity?.name ?? '' : ''}
      handle={withIdentity ? identity?.handle ?? '' : ''}
    />
  );
}

export function OwnProfileScreen() {
  const state = useRead<ProfileRead>('/api/me/profile');

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить профиль." retry={state.retry} />
    );
  }

  return <ProfileView user={toPublicUserFromProfile(state.data)} isOwn />;
}

export function OwnStatsScreen() {
  const state = useRead<ProfileStats>('/api/me/stats');

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return (
      <ErrorState message="Не удалось загрузить статистику." retry={state.retry} />
    );
  }

  return <StatisticsView stats={state.data} />;
}

export function UserProfileScreen({ handle }: { handle: string }) {
  const state = useRead<ProfileRead>(`/api/profiles/${encodeURIComponent(handle)}`);

  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    return state.code === 404 ? (
      <EmptyState title="Профиль не найден" />
    ) : (
      <ErrorState message="Не удалось загрузить профиль." retry={state.retry} />
    );
  }

  return <ProfileView user={toPublicUserFromProfile(state.data)} isOwn={state.data.isOwn} />;
}
