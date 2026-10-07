import type {
  Group,
  Movie,
  SearchFilters,
  UserStats,
  WatchedRecord,
} from './types';

function poster(label: string, bg: string, fg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='52%' fill='${fg}' font-family='sans-serif' font-size='26' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const movies: Movie[] = [
  {
    tmdbId: 27205,
    title: 'Начало',
    year: 2010,
    rating: 8.4,
    genres: ['фантастика', 'боевик'],
    actors: ['Леонардо ДиКаприо', 'Джозеф Гордон-Левитт'],
    director: 'Кристофер Нолан',
    posterUrl: poster('Начало', '#4A1F2B', '#EDEAE6'),
  },
  {
    tmdbId: 155,
    title: 'Тёмный рыцарь',
    year: 2008,
    rating: 8.5,
    genres: ['боевик', 'драма'],
    actors: ['Кристиан Бэйл', 'Хит Леджер'],
    director: 'Кристофер Нолан',
    posterUrl: poster('Тёмный рыцарь', '#121212', '#A9A29B'),
  },
  {
    tmdbId: 680,
    title: 'Криминальное чтиво',
    year: 1994,
    rating: 8.5,
    genres: ['драма', 'криминал'],
    actors: ['Джон Траволта', 'Ума Турман'],
    director: 'Квентин Тарантино',
    posterUrl: poster('Криминальное чтиво', '#8A3A3A', '#FFFFFF'),
  },
  {
    tmdbId: 603,
    title: 'Матрица',
    year: 1999,
    rating: 8.2,
    genres: ['фантастика', 'боевик'],
    actors: ['Киану Ривз', 'Лоуренс Фишбёрн'],
    director: 'Лана Вачовски',
    posterUrl: poster('Матрица', '#2B2B2B', '#D6EAF8'),
  },
  {
    tmdbId: 13,
    title: 'Форрест Гамп',
    year: 1994,
    rating: 8.5,
    genres: ['драма', 'романтика'],
    actors: ['Том Хэнкс', 'Робин Райт'],
    director: 'Роберт Земекис',
    posterUrl: poster('Форрест Гамп', '#3D6A8F', '#FFFFFF'),
  },
  {
    tmdbId: 550,
    title: 'Бойцовский клуб',
    year: 1999,
    rating: 8.4,
    genres: ['драма', 'триллер'],
    actors: ['Брэд Питт', 'Эдвард Нортон'],
    director: 'Дэвид Финчер',
    posterUrl: poster('Бойцовский клуб', '#4A1F2B', '#D89AA6'),
  },
  {
    tmdbId: 129,
    title: 'Унесённые призраками',
    year: 2001,
    rating: 8.6,
    genres: ['анимация', 'фэнтези'],
    actors: ['Руми Хиираги', 'Мию Ирино'],
    director: 'Хаяо Миядзаки',
    posterUrl: poster('Унесённые призраками', '#D6EAF8', '#2B2B2B'),
  },
  {
    tmdbId: 496243,
    title: 'Паразиты',
    year: 2019,
    rating: 8.5,
    genres: ['драма', 'триллер'],
    actors: ['Сон Кан Хо', 'Ли Сон Гюн'],
    director: 'Пон Джун Хо',
    posterUrl: null,
  },
];

export function findMovie(tmdbId: number): Movie | undefined {
  return movies.find((movie) => movie.tmdbId === tmdbId);
}

export function listMovies(): Movie[] {
  return movies;
}

export function listGenres(): string[] {
  return Array.from(new Set(movies.flatMap((movie) => movie.genres))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export const POPULAR_ACTORS = [
  'Леонардо ДиКаприо',
  'Кристиан Бэйл',
  'Том Хэнкс',
  'Брэд Питт',
  'Киану Ривз',
];

export function movieMatches(movie: Movie, query: string, filters: SearchFilters = {}): boolean {
  const q = query.trim().toLowerCase();
  const title = filters.title?.trim().toLowerCase();
  const genres = (filters.genre ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const actors = (filters.actor ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const directors = (filters.director ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const years = (filters.year ?? []).map((value) => value.trim()).filter(Boolean);

  const haystack = `${movie.title} ${movie.genres.join(' ')} ${(movie.actors ?? []).join(' ')}`;
  if (q && !haystack.toLowerCase().includes(q)) return false;
  if (title && !movie.title.toLowerCase().includes(title)) return false;
  if (genres.length > 0 && !movie.genres.some((g) => genres.includes(g.toLowerCase()))) {
    return false;
  }
  if (actors.length > 0) {
    const filmActors = (movie.actors ?? []).map((a) => a.toLowerCase());
    if (!actors.some((selected) => filmActors.some((a) => a.includes(selected)))) return false;
  }
  if (directors.length > 0) {
    const filmDirector = (movie.director ?? '').toLowerCase();
    if (!directors.some((selected) => filmDirector.includes(selected))) return false;
  }
  if (years.length > 0 && !years.includes(String(movie.year))) return false;
  return true;
}

export function searchMovies(query: string, filters: SearchFilters = {}): Movie[] {
  return movies.filter((movie) => movieMatches(movie, query, filters));
}

export function computeStats(records: WatchedRecord[]): UserStats {
  if (records.length === 0) {
    return { count: 0, genres: [], years: [] };
  }
  const genreMap = new Map<string, number>();
  const yearMap = new Map<number, number>();
  for (const record of records) {
    yearMap.set(record.movie.year, (yearMap.get(record.movie.year) ?? 0) + 1);
    for (const genre of record.movie.genres) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
    }
  }
  return {
    count: records.length,
    genres: Array.from(genreMap, ([genre, count]) => ({ genre, count })).sort(
      (a, b) => b.count - a.count,
    ),
    years: Array.from(yearMap, ([year, count]) => ({ year, count })).sort(
      (a, b) => b.year - a.year,
    ),
  };
}

const emptyStats: UserStats = { count: 0, genres: [], years: [] };

export const groups: Group[] = [
  {
    id: 1,
    name: 'Киновечера',
    description: 'Смотрим и обсуждаем по пятницам.',
    tags: ['пятница', 'обсуждение', 'компания'],
    members: [
      { id: 1, name: 'Алексей', handle: 'me', role: 'admin' },
      { id: 2, name: 'Мария', handle: 'maria', role: 'member' },
      { id: 5, name: 'Нина', handle: 'nina', role: 'member' },
    ],
    stats: emptyStats,
  },
  {
    id: 2,
    name: 'Классика',
    description: 'Фильмы до 1990 года.',
    tags: ['классика', 'ретро'],
    members: [
      { id: 3, name: 'Иван', handle: 'ivan', role: 'admin' },
      { id: 1, name: 'Алексей', handle: 'me', role: 'member' },
    ],
    stats: {
      count: 18,
      genres: [{ genre: 'драма', count: 9 }],
      years: [{ year: 1972, count: 2 }],
    },
  },
];

export function findGroup(id: number): Group | undefined {
  return groups.find((group) => group.id === id);
}

export function isGroupAdmin(group: Group, userId = 1): boolean {
  return group.members.some((member) => member.id === userId && member.role === 'admin');
}

export const otherGroups: Group[] = [
  {
    id: 3,
    name: 'Документальное кино',
    description: 'Реальные истории и биографии.',
    tags: ['документальное', 'биография'],
    members: [],
    stats: emptyStats,
  },
  {
    id: 4,
    name: 'Закрытый клуб',
    description: 'Только по приглашению.',
    tags: ['закрытый'],
    members: [],
    stats: emptyStats,
    restricted: true,
  },
];

export function searchGroups(
  query: string,
  ownGroups: Group[] = groups,
  fallback: Group[] = otherGroups,
): Group[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = (group: Group) =>
    group.name.toLowerCase().includes(q) ||
    (group.description ?? '').toLowerCase().includes(q) ||
    group.tags.some((tag) => tag.toLowerCase().includes(q));
  const scoped = ownGroups.filter(matches);
  if (scoped.length > 0) return scoped;
  return fallback.filter((group) => !group.restricted && matches(group));
}
