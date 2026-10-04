import { redirect } from 'next/navigation';

import type { ViewState } from '@/components/features/AsyncView';
import { DirectoryEntryForm } from '@/components/features/directory/DirectoryEntryForm';
import { DirectoryList } from '@/components/features/directory/DirectoryList';
import { getActor } from '@/modules/auth/session';
import {
  DEFAULT_LIMIT,
  listDirectory,
  listDirectoryInput,
  type DirectoryEntry,
} from '@/modules/directory';

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; cursor?: string }>;
}) {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const params = await searchParams;
  const parsed = listDirectoryInput.safeParse({
    limit: params.limit,
    cursor: params.cursor,
  });
  const input = parsed.success
    ? parsed.data
    : { limit: DEFAULT_LIMIT, cursor: undefined };

  const result = await listDirectory(input);

  let state: ViewState<DirectoryEntry[]>;
  if (!result.ok) {
    state = { status: 'error', message: result.message };
  } else if (result.value.items.length === 0) {
    state = { status: 'empty' };
  } else {
    state = { status: 'success', data: result.value.items };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Справочник</h1>
        <p className="text-sm text-muted-foreground">
          Данные читаются серверным компонентом через сервис модуля.
        </p>
      </header>

      <DirectoryList state={state} />

      {actor.role === 'admin' ? (
        <section className="space-y-3 rounded-md border p-4">
          <h2 className="text-lg font-medium">Новая запись</h2>
          <DirectoryEntryForm />
        </section>
      ) : null}
    </div>
  );
}
