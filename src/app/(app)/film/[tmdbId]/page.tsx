import { notFound } from 'next/navigation';

import { FilmDetail } from '@/components/features/movie-tracker/FilmDetail';
import { findMovie } from '@/components/features/movie-tracker/data';

export default async function FilmPage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const { tmdbId } = await params;
  const movie = findMovie(Number(tmdbId));
  if (!movie) {
    notFound();
  }

  return <FilmDetail movie={movie} />;
}
