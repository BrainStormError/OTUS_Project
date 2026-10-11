'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { TagInput } from './TagInput';

export function GroupSettingsForm({
  group,
}: {
  group: {
    id: number;
    name: string;
    description?: string;
    tags: string[];
    restricted?: boolean;
  };
}) {
  const router = useRouter();
  const nameId = useId();
  const descriptionId = useId();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [tags, setTags] = useState<string[]>(group.tags);
  const [restricted, setRestricted] = useState(Boolean(group.restricted));
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus('idle');
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, tags, restricted }),
      });
      if (!response.ok) {
        setStatus('error');
        return;
      }
      setStatus('saved');
      router.refresh();
    } catch {
      setStatus('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-lg border border-border bg-card p-4"
      onSubmit={handleSubmit}
      data-testid="group-settings-form"
    >
      <h2 className="text-lg font-medium">Настройки группы</h2>

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
            name="group-visibility"
            checked={!restricted}
            onChange={() => setRestricted(false)}
          />
          Открытая — видна в поиске
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="group-visibility"
            checked={restricted}
            onChange={() => setRestricted(true)}
          />
          Закрытая — только по приглашению
        </label>
      </fieldset>

      {status === 'saved' ? (
        <p role="status" className="text-sm text-muted-foreground">
          Сохранено
        </p>
      ) : null}
      {status === 'error' ? (
        <p role="alert" className="text-sm text-destructive">
          Не удалось сохранить
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        Сохранить
      </Button>
    </form>
  );
}
