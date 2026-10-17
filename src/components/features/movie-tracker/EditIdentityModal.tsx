'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

import { IDENTITY_READS, invalidateReads } from './read-invalidation';

export type IdentityField = 'name' | 'handle';

const FIELDS: Record<
  IdentityField,
  { title: string; label: string; hint: string; autoComplete: string; maxLength: number }
> = {
  name: {
    title: 'Изменить имя',
    label: 'Отображаемое имя',
    hint: 'От 1 до 100 символов. Имя может совпадать с именами других пользователей.',
    autoComplete: 'nickname',
    maxLength: 100,
  },
  handle: {
    title: 'Изменить тэг',
    label: 'Тэг (handle)',
    hint: 'Строчные латинские буквы, цифры, «_» и «-», до 50 символов. Менять можно раз в месяц.',
    autoComplete: 'username',
    maxLength: 50,
  },
};

// Mounted only while the modal is open, so the field starts from the current
// value without a state-syncing effect.
function IdentityForm({
  field,
  currentValue,
  onClose,
  onSaved,
}: {
  field: IdentityField;
  currentValue: string;
  onClose: () => void;
  onSaved?: (value: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputId = useId();
  const [value, setValue] = useState(currentValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const config = FIELDS[field];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/me/identity', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Не удалось сохранить');
        return;
      }
      void invalidateReads(IDENTITY_READS);
      onSaved?.(value);
      onClose();
      if (field === 'handle' && pathname.startsWith('/u/')) {
        router.push('/me');
      }
    } catch {
      setError('Не удалось сохранить');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          {config.label}
        </label>
        <Input
          id={inputId}
          name={field}
          value={value}
          autoComplete={config.autoComplete}
          maxLength={config.maxLength}
          onChange={(event) => setValue(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{config.hint}</p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          Сохранить
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

export function EditIdentityModal({
  open,
  field,
  currentValue,
  onClose,
  onSaved,
}: {
  open: boolean;
  field: IdentityField;
  currentValue: string;
  onClose: () => void;
  onSaved?: (value: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={FIELDS[field].title}>
      <IdentityForm
        key={`${field}:${currentValue}`}
        field={field}
        currentValue={currentValue}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
