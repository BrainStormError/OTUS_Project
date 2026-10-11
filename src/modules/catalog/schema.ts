import { z } from 'zod';

export const catalogKinds = ['film', 'series'] as const;

export const catalogGenresQuery = z.object({
  kind: z.enum(catalogKinds).optional(),
});

export type CatalogGenresQuery = z.infer<typeof catalogGenresQuery>;

export const catalogSearchQuery = z
  .object({
    kind: z.enum(catalogKinds),
    q: z.string().trim().max(200).optional(),
    genre: z.string().trim().max(200).optional(),
    yearFrom: z.coerce.number().int().min(1800).max(2200).optional(),
    yearTo: z.coerce.number().int().min(1800).max(2200).optional(),
    page: z.coerce.number().int().min(1).max(500).optional(),
  })
  .refine(
    (value) =>
      value.yearFrom === undefined ||
      value.yearTo === undefined ||
      value.yearFrom <= value.yearTo,
    { message: 'Нижняя граница года не может быть больше верхней', path: ['yearFrom'] },
  );

export type CatalogSearchQuery = z.infer<typeof catalogSearchQuery>;

export const catalogDetailQuery = z.object({
  kind: z.enum(catalogKinds),
  id: z.string().trim().min(1).max(128),
});

export type CatalogDetailQuery = z.infer<typeof catalogDetailQuery>;
