'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

import { TagInput } from './TagInput';

function CreateGroupForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const nameId = useId();
  const descriptionId = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [restricted, setRestricted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, tags, restricted }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        const message = data.error ?? 'Не удалось создать группу';
        setError(message);
        toast.error(message);
        return;
      }
      const data = (await response.json()) as { id: number };
      toast.success('Группа создана');
      onClose();
      router.push(`/groups/${data.id}`);
    } catch {
      setError('Не удалось создать группу');
      toast.error('Не удалось создать группу');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label htmlFor={nameId} className="text-sm font-medium">
          Название
        </label>
        <Input
          id={nameId}
          value={name}
          maxLength={100}
          required
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={descriptionId} className="text-sm font-medium">
          Описание
        </label>
        <Textarea
          id={descriptionId}
          value={description}
          maxLength={1000}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <TagInput value={tags} onChange={setTags} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Видимость</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            checked={!restricted}
            onChange={() => setRestricted(false)}
          />
          Открытая — видна в поиске
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            checked={restricted}
            onChange={() => setRestricted(true)}
          />
          Закрытая — только по приглашению
        </label>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          Создать группу
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Создать группу">
      <CreateGroupForm onClose={onClose} />
    </Modal>
  );
}
