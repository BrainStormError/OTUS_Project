import { AsyncView, type ViewState } from '@/components/features/AsyncView';
import type { DirectoryEntry } from '@/modules/directory/types';

export function DirectoryList({ state }: { state: ViewState<DirectoryEntry[]> }) {
  return (
    <AsyncView state={state} emptyMessage="Справочник пуст">
      {(entries) => (
        <ul className="divide-y rounded-md border">
          {entries.map((entry) => (
            <li key={entry.id} className="space-y-1 p-4">
              <p className="font-medium">{entry.name}</p>
              {entry.description ? (
                <p className="text-sm text-muted-foreground">{entry.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AsyncView>
  );
}
