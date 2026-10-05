import type { Series, SeriesRecord } from './types';

function poster(label: string, bg: string, fg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='52%' fill='${fg}' font-family='sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const seriesCatalog: Series[] = [
  {
    id: 'breaking-bad',
    title: 'Во все тяжкие',
    year: 2008,
    genres: ['драма', 'криминал'],
    posterUrl: poster('Во все тяжкие', '#2B2B2B', '#D6EAF8'),
    seasons: [
      {
        number: 1,
        episodes: [
          { number: 1, title: 'Пилот' },
          { number: 2, title: 'Кот в мешке' },
          { number: 3, title: 'Вода в пустыне' },
        ],
      },
      {
        number: 2,
        episodes: [
          { number: 1, title: 'Семь-тридцать семь' },
          { number: 2, title: 'Пепел' },
        ],
      },
    ],
  },
  {
    id: 'chernobyl',
    title: 'Чернобыль',
    year: 2019,
    genres: ['драма', 'история'],
    posterUrl: poster('Чернобыль', '#4A1F2B', '#EDEAE6'),
    seasons: [
      {
        number: 1,
        episodes: [
          { number: 1, title: '1:23:45' },
          { number: 2, title: 'Пожалуйста, оставайтесь спокойны' },
          { number: 3, title: 'Открой широко' },
        ],
      },
    ],
  },
  {
    id: 'squid-game',
    title: 'Игра в кальмара',
    year: 2021,
    genres: ['триллер', 'драма'],
    posterUrl: poster('Игра в кальмара', '#3D6A8F', '#FFFFFF'),
    seasons: [
      {
        number: 1,
        episodes: [
          { number: 1, title: 'Игра началась' },
          { number: 2, title: 'Ад' },
          { number: 3, title: 'Человек с зонтом' },
        ],
      },
    ],
  },
  {
    id: 'dark',
    title: 'Тьма',
    year: 2017,
    genres: ['фантастика', 'триллер'],
    posterUrl: poster('Тьма', '#121212', '#D89AA6'),
    seasons: [
      {
        number: 1,
        episodes: [
          { number: 1, title: 'Тайны' },
          { number: 2, title: 'Ложь' },
        ],
      },
    ],
  },
];

export function listSeries(): Series[] {
  return seriesCatalog;
}

export function findSeries(id: string): Series | undefined {
  return seriesCatalog.find((series) => series.id === id);
}

export const seriesRecords: SeriesRecord[] = [
  {
    id: 's-breaking-bad',
    series: seriesCatalog[0]!,
    mode: 'per-episode',
    episodes: {
      '1:1': { rating: 9, comment: 'Пилот' },
      '1:2': { rating: 8.5 },
      '2:1': { rating: 10 },
    },
    watchedAt: '2026-08-10',
  },
  {
    id: 's-chernobyl',
    series: seriesCatalog[1]!,
    mode: 'whole',
    seriesRating: 9.4,
    seriesComment: 'Мощно.',
    watchedAt: '2026-07-15',
  },
  {
    id: 's-squid-game',
    series: seriesCatalog[2]!,
    mode: 'per-episode',
    episodes: {
      '1:1': { rating: 8 },
      '1:2': { rating: 7.5 },
    },
    watchedAt: '2026-06-01',
  },
];
