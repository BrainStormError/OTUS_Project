'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { EditIdentityModal, type IdentityField } from './EditIdentityModal';
import { IdentitySelect } from './IdentitySelect';
import { PrivacyToggle, type SaveStatus } from './PrivacyToggle';
import { ThemeSelect } from './ThemeSelect';

type FlagKey = 'profileHidden' | 'statsHidden';
type Flags = Record<FlagKey, boolean>;

const IDLE_STATUS: Record<FlagKey, SaveStatus> = {
  profileHidden: 'idle',
  statsHidden: 'idle',
};

export function SettingsView({
  initialProfileHidden = false,
  initialStatsHidden = false,
  name = '',
  handle = '',
}: {
  initialProfileHidden?: boolean;
  initialStatsHidden?: boolean;
  name?: string;
  handle?: string;
}) {
  const [flags, setFlags] = useState<Flags>({
    profileHidden: initialProfileHidden,
    statsHidden: initialStatsHidden,
  });
  const [status, setStatus] = useState<Record<FlagKey, SaveStatus>>(IDLE_STATUS);
  const [editField, setEditField] = useState<IdentityField | null>(null);

  async function save(key: FlagKey, next: boolean) {
    const previous = flags;
    const nextFlags = { ...flags, [key]: next };
    setFlags(nextFlags);
    setStatus((current) => ({ ...current, [key]: 'saving' }));
    try {
      const response = await fetch('/api/me/privacy', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(nextFlags),
      });
      if (!response.ok) {
        throw new Error('privacy update failed');
      }
      const data = (await response.json()) as Partial<Flags>;
      setFlags({
        profileHidden: data.profileHidden ?? nextFlags.profileHidden,
        statsHidden: data.statsHidden ?? nextFlags.statsHidden,
      });
      setStatus((current) => ({ ...current, [key]: 'saved' }));
    } catch {
      setFlags(previous);
      setStatus((current) => ({ ...current, [key]: 'error' }));
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-label="Тема">
        <h2 className="text-lg font-medium">Тема оформления</h2>
        <ThemeSelect />
      </section>

      <section className="space-y-3" aria-label="Отображение имени">
        <h2 className="text-lg font-medium">Отображение имени</h2>
        <p className="text-sm text-muted-foreground">
          Что показывать в верхней панели: имя, тег или и то, и другое.
        </p>
        <IdentitySelect />
      </section>

      <section className="space-y-3" aria-label="Имя и тэг">
        <h2 className="text-lg font-medium">Имя и тэг</h2>
        <p className="text-sm text-muted-foreground">
          Измените отображаемое имя или уникальный тэг профиля.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setEditField('name')}>
            Изменить имя
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditField('handle')}>
            Изменить тэг
          </Button>
        </div>
      </section>

      <section className="space-y-1" aria-label="Приватность">
        <h2 className="text-lg font-medium">Приватность</h2>
        <div className="divide-y divide-border rounded-lg border border-border px-4">
          <PrivacyToggle
            label="Скрыть профиль"
            description="Другие увидят только ваше имя."
            checked={flags.profileHidden}
            status={status.profileHidden}
            onChange={(next) => void save('profileHidden', next)}
          />
          <PrivacyToggle
            label="Скрыть статистику"
            description="Оценки и распределения не будут видны другим."
            checked={flags.statsHidden}
            status={status.statsHidden}
            onChange={(next) => void save('statsHidden', next)}
          />
        </div>
      </section>

      <EditIdentityModal
        open={editField === 'name'}
        field="name"
        currentValue={name}
        onClose={() => setEditField(null)}
      />
      <EditIdentityModal
        open={editField === 'handle'}
        field="handle"
        currentValue={handle}
        onClose={() => setEditField(null)}
      />
    </div>
  );
}
