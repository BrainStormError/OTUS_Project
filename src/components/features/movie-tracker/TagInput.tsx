'use client';

import { X } from 'lucide-react';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const MAX_TAG_LENGTH = 80;

export function TagInput({
  value,
  onChange,
  label = 'Теги',
  id,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  id?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag) {
      return;
    }
    const deduped = value.some((existing) => existing.toLowerCase() === tag.toLowerCase());
    if (!deduped) {
      onChange([...value, tag]);
    }
    setDraft('');
  }

  function remove(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Теги группы">
          {value.map((tag) => (
            <li key={tag}>
              <Badge className="gap-1">
                {tag}
                <button
                  type="button"
                  aria-label={`Удалить тег ${tag}`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => remove(tag)}
                >
                  <X aria-hidden="true" className="h-3 w-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add(draft);
            }
          }}
          placeholder="Добавить тег и нажать Enter"
        />
        <Button type="button" variant="outline" onClick={() => add(draft)}>
          Добавить тег
        </Button>
      </div>
    </div>
  );
}
