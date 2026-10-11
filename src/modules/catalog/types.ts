export type CatalogMediaKind = 'film' | 'series';

export type Genre = {
  id: number;
  name: string;
};

export type CatalogSearchResult = {
  kind: CatalogMediaKind;
  externalId: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  externalRating: number | null;
  genres: string[];
  genreIds: number[];
};

export type CatalogDetail = CatalogSearchResult & {
  overview: string | null;
  director: string | null;
};

export type SaveMetadata = {
  kind: CatalogMediaKind;
  externalRef: string;
  title: string;
  year: number | null;
  director: string | null;
  genreIds: number[];
};

export type RatedTitle = {
  ratingId: number;
  mediaId: number;
  kind: CatalogMediaKind;
  externalRef: string;
  title: string;
  year: number | null;
  director: string | null;
  genres: string[];
  rating: number;
  comment: string | null;
  watchedAt: string;
};

export type CatalogSearchInput = {
  kind: CatalogMediaKind;
  title?: string;
  genreIds?: number[];
  yearFrom?: number;
  yearTo?: number;
  page?: number;
};

export type CatalogSearchPage = {
  items: CatalogSearchResult[];
  page: number;
  hasMore: boolean;
};
