import { MySeriesView } from '@/components/features/movie-tracker/MySeriesView';

export default function SeriesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Мои сериалы</h1>
        <p className="text-sm text-muted-foreground">Просмотренные сериалы и оценки.</p>
      </header>
      <MySeriesView />
    </div>
  );
}
