'use client';

import { Pencil, UserRound } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { EditIdentityModal, type IdentityField } from './EditIdentityModal';

export function EditableIdentity({ name, handle }: { name: string; handle: string }) {
  const [field, setField] = useState<IdentityField | null>(null);

  return (
    <header className="flex flex-wrap items-center gap-4">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
      >
        <UserRound className="h-8 w-8" />
      </span>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Изменить имя"
            onClick={() => setField('name')}
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">@{handle}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Изменить тэг"
            onClick={() => setField('handle')}
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditIdentityModal
        open={field === 'name'}
        field="name"
        currentValue={name}
        onClose={() => setField(null)}
      />
      <EditIdentityModal
        open={field === 'handle'}
        field="handle"
        currentValue={handle}
        onClose={() => setField(null)}
      />
    </header>
  );
}
