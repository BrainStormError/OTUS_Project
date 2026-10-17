import { CatalogListScreen } from '@/components/features/movie-tracker/screens/catalog-screens';

export default function FilmsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Мои фильмы</h1>
        <p className="text-sm text-muted-foreground">Просмотренные фильмы и оценки.</p>
      </header>
      <CatalogListScreen kind="film" />
    </div>
  );
}
