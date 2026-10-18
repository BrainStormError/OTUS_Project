export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
        <span>Смотровик — учебный проект OTUS.</span>
        <span className="font-mono text-xs">v1.0</span>
        <span>Данные о фильмах и сериалах предоставлены TMDB</span>
      </div>
    </footer>
  );
}
