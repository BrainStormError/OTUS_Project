import { redirect } from 'next/navigation';

import { toWatchedRecord } from '@/components/features/movie-tracker/adapters';
import { RecordView } from '@/components/features/movie-tracker/RecordView';
import { getActor } from '@/modules/auth/session';
import { listWatchedRecords } from '@/modules/records';

export const dynamic = 'force-dynamic';

export default async function FilmRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }

  const result = await listWatchedRecords(actor);
  const entry = result.ok
    ? result.value.find((item) => String(item.id) === id && item.mediaKind === 'film')
    : undefined;

  return <RecordView record={entry ? toWatchedRecord(entry) : null} />;
}
