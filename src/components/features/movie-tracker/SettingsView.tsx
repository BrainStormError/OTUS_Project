'use client';

import { useState } from 'react';

import { IdentitySelect } from './IdentitySelect';
import { PrivacyToggle } from './PrivacyToggle';
import { ThemeSelect } from './ThemeSelect';

export function SettingsView({
  initialProfileHidden = false,
  initialStatsHidden = false,
}: {
  initialProfileHidden?: boolean;
  initialStatsHidden?: boolean;
}) {
  const [profileHidden, setProfileHidden] = useState(initialProfileHidden);
  const [statsHidden, setStatsHidden] = useState(initialStatsHidden);

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

      <section className="space-y-1" aria-label="Приватность">
        <h2 className="text-lg font-medium">Приватность</h2>
        <div className="divide-y divide-border rounded-lg border border-border px-4">
          <PrivacyToggle
            label="Скрыть профиль"
            description="Другие увидят только ваше имя."
            checked={profileHidden}
            onChange={setProfileHidden}
          />
          <PrivacyToggle
            label="Скрыть статистику"
            description="Оценки и распределения не будут видны другим."
            checked={statsHidden}
            onChange={setStatsHidden}
          />
        </div>
      </section>
    </div>
  );
}
