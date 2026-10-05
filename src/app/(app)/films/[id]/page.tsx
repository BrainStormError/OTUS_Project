import { RecordView } from '@/components/features/movie-tracker/RecordView';

export default async function FilmRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordView id={id} />;
}
